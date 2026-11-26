import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Task } from '@/types/task';
import {
  isCompletedOn,
  todayString,
  upcomingOccurrences,
} from '@/utils/recurrence';

// 繰り返し予定について、
// 直近何件分の出現を通知対象にするか
const MAX_RECURRENCE_NOTIFICATIONS = 3;

const ANDROID_CHANNEL_ID = 'task-reminders';

// このアプリが管理する通知かどうか
// （スケジュール時に data へ taskId を入れている）
function isManagedNotification(
  notification: Notifications.NotificationRequest
): boolean {
  const data = notification.content.data;

  return (
    data !== null &&
    typeof data === 'object' &&
    typeof data.taskId === 'string'
  );
}

// 日付 (YYYY-MM-DD) と時刻 (HH:mm) から
// ローカルの Date を作る
function toDateTime(
  date: string,
  time: string
): Date | null {
  const dateMatch = date.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  const timeMatch = time.match(
    /^(\d{1,2}):(\d{2})$/
  );

  if (!dateMatch || !timeMatch) {
    return null;
  }

  return new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    0,
    0
  );
}

// 通知許可を確認し、未許可ならリクエストする
// 許可された場合は true を返す
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      return true;
    }

    const { status } =
      await Notifications.requestPermissionsAsync();

    return status === 'granted';
  } catch (error) {
    console.error(
      '通知許可の確認に失敗しました:',
      error
    );

    return false;
  }
}

// Android 用の通知チャンネルを作成する
async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(
    ANDROID_CHANNEL_ID,
    {
      name: '予定のリマインダー',
      importance:
        Notifications.AndroidImportance.DEFAULT,
    }
  );
}

// 1件の出現分を通知スケジュールする
// minutesBefore 分だけ開始時刻より前に通知する
async function scheduleOccurrence(
  task: Task,
  date: string,
  minutesBefore: number
) {
  const dateTime = toDateTime(
    date,
    task.startTime
  );

  if (dateTime === null) {
    return;
  }

  // 通知タイミング分だけ前倒しする
  const notifyDateTime = new Date(
    dateTime.getTime() -
      minutesBefore * 60 * 1000
  );

  // 過去の時刻には通知しない
  // （前倒しした時刻に対して判定する）
  if (notifyDateTime.getTime() <= Date.now()) {
    return;
  }

  const body = task.memo
    ? `${date} ${task.startTime}開始\n${task.memo}`
    : `${date} ${task.startTime}開始`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: task.title,
      body,
      data: {
        taskId: task.id,
        date,
      },
    },
    trigger: {
      type: Notifications
        .SchedulableTriggerInputTypes.DATE,
      date: notifyDateTime,
      ...(Platform.OS === 'android'
        ? { channelId: ANDROID_CHANNEL_ID }
        : {}),
    },
  });
}

// -----------------------------
// 予定全体と通知を同期する
//
// 追加・編集・削除・完了のたびに
// TaskProvider から呼ばれ、
// 管理中の通知をいったんすべて解除して
// 現在の予定に合わせて登録し直す
// -----------------------------
export async function syncTaskNotifications(
  tasks: Task[],
  enabled: boolean,
  minutesBefore: number = 0
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    // 管理中の通知をすべて解除
    const scheduled =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduled) {
      if (isManagedNotification(notification)) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }

    if (!enabled) {
      return;
    }

    // 通知対象がある場合のみ許可を確認する
    const hasTarget = tasks.some(
      (task) => task.startTime !== ''
    );

    if (!hasTarget) {
      return;
    }

    const granted =
      await ensureNotificationPermission();

    if (!granted) {
      return;
    }

    await ensureAndroidChannel();

    const today = todayString();

    for (const task of tasks) {
      // 時刻のない予定は通知しない
      if (task.startTime === '') {
        continue;
      }

      if (!task.recurrence) {
        // 完了済みの予定は通知しない
        if (task.completed) {
          continue;
        }

        await scheduleOccurrence(
          task,
          task.date,
          minutesBefore
        );
      } else {
        // 繰り返し予定は、未完了の直近の
        // 出現分だけを通知対象にする
        const occurrences =
          upcomingOccurrences(
            task,
            today,
            MAX_RECURRENCE_NOTIFICATIONS * 2
          ).filter(
            (date) => !isCompletedOn(task, date)
          );

        for (const date of occurrences.slice(
          0,
          MAX_RECURRENCE_NOTIFICATIONS
        )) {
          await scheduleOccurrence(
            task,
            date,
            minutesBefore
          );
        }
      }
    }
  } catch (error) {
    console.error(
      '通知の同期に失敗しました:',
      error
    );
  }
}
