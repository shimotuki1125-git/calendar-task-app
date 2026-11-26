import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { ReactNode } from 'react';

import { useSettings } from '@/contexts/settings-context';
import { syncTaskNotifications } from '@/notifications/task-notifications';
import {
  loadTasks,
  saveTasks,
} from '@/storage/task-storage';

import type {
  Recurrence,
  Task,
} from '@/types/task';

// 予定の追加・編集時に指定できる項目
export type TaskOptions = {
  endTime?: string;
  memo?: string;
  recurrence?: Recurrence;
};

type TaskContextType = {
  tasks: Task[];
  isLoaded: boolean;

  addTask: (
    title: string,
    date: string,
    startTime: string,
    options?: TaskOptions
  ) => void;

  // date を渡すと、その日付の完了状態を
  // 切り替える（繰り返し予定用）
  // 省略した場合は予定全体の完了状態を切り替える
  toggleTask: (id: string, date?: string) => void;

  updateTask: (
    id: string,
    title: string,
    date: string,
    startTime: string,
    options?: TaskOptions
  ) => void;

  deleteTask: (id: string) => void;

  // 完成済みの予定オブジェクトを
  // そのまま追加する
  // （繰り返しの「この回だけ」編集で
  //   分離した単発予定の作成に使う）
  addTaskObject: (task: Task) => void;

  // 繰り返し予定の特定の出現日を
  // スキップする（出現しなくなる）
  // removeCompleted を指定すると、その日の
  // 完了記録も元の予定から取り除く
  skipOccurrence: (
    id: string,
    date: string,
    options?: { removeCompleted?: boolean }
  ) => void;

  // 複数の予定の日付をまとめて変更する
  // （期限切れの「今日へ移す」用）
  moveTasksToDate: (
    ids: string[],
    date: string
  ) => void;

  // 複数の予定をまとめて完了にする
  // （期限切れの「すべて完了」用）
  completeTasks: (ids: string[]) => void;

  // バックアップの読み込み用：
  // 予定をすべて置き換える
  // （保存と通知の同期は既存の仕組みで連動する）
  replaceTasks: (tasks: Task[]) => void;
};

const TaskContext =
  createContext<TaskContextType | undefined>(
    undefined
  );

export function TaskProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [isLoaded, setIsLoaded] =
    useState(false);

  const {
    notificationsEnabled,
    reminderMinutesBefore,
    isLoaded: isSettingsLoaded,
  } = useSettings();

  // 保存されている予定を読み込む
  useEffect(() => {
    const initializeTasks = async () => {
      const savedTasks = await loadTasks();

      setTasks(savedTasks);
      setIsLoaded(true);
    };

    initializeTasks();
  }, []);

  // 予定が変更されたら保存
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveTasks(tasks);
  }, [tasks, isLoaded]);

  // 予定や通知設定が変更されたら
  // 通知スケジュールを同期する
  // （追加・編集・削除・完了すべてに連動）
  useEffect(() => {
    if (!isLoaded || !isSettingsLoaded) {
      return;
    }

    syncTaskNotifications(
      tasks,
      notificationsEnabled,
      reminderMinutesBefore
    );
  }, [
    tasks,
    isLoaded,
    notificationsEnabled,
    reminderMinutesBefore,
    isSettingsLoaded,
  ]);

  // -----------------------------
  // 予定を追加
  // -----------------------------

  const addTask = (
    title: string,
    date: string,
    startTime: string,
    options?: TaskOptions
  ) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      date,
      startTime,
      completed: false,
      endTime: options?.endTime || undefined,
      memo: options?.memo || undefined,
      recurrence: options?.recurrence,
      completedDates: options?.recurrence
        ? []
        : undefined,
    };

    setTasks((currentTasks) => [
      ...currentTasks,
      newTask,
    ]);
  };

  // -----------------------------
  // 完了 / 未完了を切り替え
  // -----------------------------

  const toggleTask = (id: string, date?: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== id) {
          return task;
        }

        // 繰り返し予定は日付ごとに
        // 完了状態を管理する
        if (task.recurrence && date) {
          const completedDates =
            task.completedDates ?? [];

          const nextCompletedDates =
            completedDates.includes(date)
              ? completedDates.filter(
                  (completedDate) =>
                    completedDate !== date
                )
              : [...completedDates, date];

          return {
            ...task,
            completedDates: nextCompletedDates,
          };
        }

        return {
          ...task,
          completed: !task.completed,
        };
      })
    );
  };

  // -----------------------------
  // 予定を編集
  // -----------------------------

  const updateTask = (
    id: string,
    title: string,
    date: string,
    startTime: string,
    options?: TaskOptions
  ) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== id) {
          return task;
        }

        const wasRecurring = !!task.recurrence;
        const isRecurring = !!options?.recurrence;

        return {
          ...task,
          title,
          date,
          startTime,
          endTime:
            options?.endTime || undefined,
          memo: options?.memo || undefined,
          recurrence: options?.recurrence,

          // 繰り返しでなくなった場合は
          // 日付ごとの完了状態を破棄する
          // 新しく繰り返しになった場合は
          // 空の一覧から始める
          completedDates: isRecurring
            ? (wasRecurring
                ? task.completedDates
                : [])
            : undefined,

          // スキップした日付も
          // 完了状態と同じ扱いにする
          skippedDates: isRecurring
            ? (wasRecurring
                ? task.skippedDates
                : undefined)
            : undefined,
        };
      })
    );
  };

  // -----------------------------
  // 予定を削除
  // -----------------------------

  const deleteTask = (id: string) => {
    setTasks((currentTasks) =>
      currentTasks.filter(
        (task) => task.id !== id
      )
    );
  };

  // -----------------------------
  // 完成済みの予定オブジェクトを追加
  // -----------------------------

  const addTaskObject = (task: Task) => {
    setTasks((currentTasks) => [
      ...currentTasks,
      task,
    ]);
  };

  // -----------------------------
  // 繰り返し予定の出現日をスキップ
  // -----------------------------

  const skipOccurrence = (
    id: string,
    date: string,
    options?: { removeCompleted?: boolean }
  ) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== id) {
          return task;
        }

        const skippedDates =
          task.skippedDates ?? [];

        return {
          ...task,

          skippedDates:
            skippedDates.includes(date)
              ? skippedDates
              : [...skippedDates, date],

          // 分離した単発予定へ完了状態を
          // 移す場合は、元の完了記録を消す
          completedDates:
            options?.removeCompleted
              ? (task.completedDates ?? [])
                  .filter(
                    (completedDate) =>
                      completedDate !== date
                  )
              : task.completedDates,
        };
      })
    );
  };

  // -----------------------------
  // 複数の予定の日付をまとめて変更
  // -----------------------------

  const moveTasksToDate = (
    ids: string[],
    date: string
  ) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        ids.includes(task.id)
          ? { ...task, date }
          : task
      )
    );
  };

  // -----------------------------
  // 複数の予定をまとめて完了にする
  // -----------------------------

  const completeTasks = (ids: string[]) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        ids.includes(task.id)
          ? { ...task, completed: true }
          : task
      )
    );
  };

  // -----------------------------
  // 予定をすべて置き換え
  // -----------------------------

  const replaceTasks = (nextTasks: Task[]) => {
    setTasks(nextTasks);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoaded,
        addTask,
        toggleTask,
        updateTask,
        deleteTask,
        addTaskObject,
        skipOccurrence,
        moveTasksToDate,
        completeTasks,
        replaceTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);

  if (context === undefined) {
    throw new Error(
      'useTasks must be used inside TaskProvider'
    );
  }

  return context;
}
