import type { Task } from '@/types/task';

// -----------------------------------
// 日付ユーティリティ
// 日付はすべてローカル日付の
// YYYY-MM-DD 文字列として扱う
// -----------------------------------

// YYYY-MM-DD → Date（ローカル）
export function parseDate(date: string): Date {
  const [year, month, day] = date
    .split('-')
    .map(Number);

  return new Date(year, month - 1, day);
}

// Date → YYYY-MM-DD（ローカル）
export function formatDate(date: Date): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(date.getDate()).padStart(
    2,
    '0'
  );

  return `${year}-${month}-${day}`;
}

// 今日の日付 (YYYY-MM-DD)
export function todayString(): string {
  return formatDate(new Date());
}

// 日付文字列に日数を加える
export function addDays(
  date: string,
  days: number
): string {
  const result = parseDate(date);

  result.setDate(result.getDate() + days);

  return formatDate(result);
}

// -----------------------------------
// 繰り返しの出現判定
// -----------------------------------

// 指定した日付に予定が出現するか
export function occursOn(
  task: Task,
  date: string
): boolean {
  // 開始日より前には出現しない
  if (date < task.date) {
    return false;
  }

  if (!task.recurrence) {
    return task.date === date;
  }

  const { freq, until } = task.recurrence;

  // 繰り返し終了日を過ぎたら出現しない
  if (until && date > until) {
    return false;
  }

  if (freq === 'daily') {
    return true;
  }

  const start = parseDate(task.date);
  const target = parseDate(date);

  if (freq === 'weekly') {
    return start.getDay() === target.getDay();
  }

  // monthly: 開始日と同じ「日」に出現する
  // 対象の月にその日が存在しない場合
  // （例: 開始日が31日で30日までしかない月）は
  // 出現しない
  return start.getDate() === target.getDate();
}

// 期間内に出現する日付の一覧
export function getOccurrencesInRange(
  task: Task,
  startDate: string,
  endDate: string
): string[] {
  const occurrences: string[] = [];

  let current = startDate;

  while (current <= endDate) {
    if (occursOn(task, current)) {
      occurrences.push(current);
    }

    current = addDays(current, 1);
  }

  return occurrences;
}

// 指定日以降で最初の出現日
// 探索は最大で約1年先まで
export function nextOccurrenceOnOrAfter(
  task: Task,
  fromDate: string,
  maxDays = 370
): string | null {
  let current =
    fromDate < task.date ? task.date : fromDate;

  for (let i = 0; i <= maxDays; i++) {
    if (occursOn(task, current)) {
      return current;
    }

    current = addDays(current, 1);
  }

  return null;
}

// 指定日以降の出現日を最大 count 件返す
// （通知スケジュール用）
export function upcomingOccurrences(
  task: Task,
  fromDate: string,
  count: number,
  maxDays = 370
): string[] {
  const occurrences: string[] = [];

  let current =
    fromDate < task.date ? task.date : fromDate;

  for (
    let i = 0;
    i <= maxDays && occurrences.length < count;
    i++
  ) {
    if (occursOn(task, current)) {
      occurrences.push(current);
    }

    current = addDays(current, 1);
  }

  return occurrences;
}

// -----------------------------------
// 日付ごとの完了状態
// -----------------------------------

// 指定した日付の予定が完了しているか
export function isCompletedOn(
  task: Task,
  date: string
): boolean {
  if (task.recurrence) {
    return (task.completedDates ?? []).includes(
      date
    );
  }

  return task.completed;
}

// 一覧表示用に、指定日の完了状態を
// completed へ反映したコピーを返す
export function taskForDate(
  task: Task,
  date: string
): Task {
  return {
    ...task,
    completed: isCompletedOn(task, date),
  };
}
