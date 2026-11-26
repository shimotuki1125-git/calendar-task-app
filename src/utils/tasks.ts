import type { Task } from '@/types/task';
import { occursOn } from '@/utils/recurrence';

// -----------------------------------
// 時刻の形式チェック
// 空文字（時刻なし）か HH:mm
// （00–23時、00–59分）であること
// -----------------------------------

const TIME_PATTERN =
  /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimeString(
  value: string
): boolean {
  return (
    value === '' || TIME_PATTERN.test(value)
  );
}

// -----------------------------------
// 表示用の並べ替え
// 保存データの順序は変えず、
// 表示するときだけ並べ替える
// -----------------------------------

// 時刻の比較
// 時刻なし（空文字）は最後尾にする
function compareStartTime(
  a: Task,
  b: Task
): number {
  if (a.startTime === b.startTime) {
    return 0;
  }

  if (a.startTime === '') {
    return 1;
  }

  if (b.startTime === '') {
    return -1;
  }

  // HH:mm はゼロ埋めされているため
  // 文字列の比較で時刻順になる
  return a.startTime < b.startTime ? -1 : 1;
}

// 同じ日の中で時刻順に並べ替える
export function sortTasksByTime(
  tasks: Task[]
): Task[] {
  return [...tasks].sort(compareStartTime);
}

// 日付昇順 → 時刻順に並べ替える
// （期限切れ欄の表示用）
export function sortTasksByDateTime(
  tasks: Task[]
): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? -1 : 1;
    }

    return compareStartTime(a, b);
  });
}

// 検索結果1件分
// （表示される日付を添えた予定）
export type SearchResultEntry = {
  task: Task;

  // 一覧に表示される日付
  // 通常予定は予定日、繰り返し予定は
  // 今日以降の次回出現日
  displayDate: string;
};

// 表示される日付の昇順 → 時刻順に
// 並べ替える（検索結果の表示用）
export function sortSearchResults(
  entries: SearchResultEntry[]
): SearchResultEntry[] {
  return [...entries].sort((a, b) => {
    if (a.displayDate !== b.displayDate) {
      return a.displayDate < b.displayDate
        ? -1
        : 1;
    }

    return compareStartTime(a.task, b.task);
  });
}

// -----------------------------------
// 予定の重なり判定
// -----------------------------------

// HH:mm → 0時からの分数
function timeToMinutes(time: string): number {
  const [hours, minutes] = time
    .split(':')
    .map(Number);

  return hours * 60 + minutes;
}

// 2つの予定の時間帯が重なるか
// 終了時刻がある予定は [開始, 終了) の区間、
// ない予定は開始時刻の一点として扱う
// 一点同士は開始時刻が同じ場合のみ重なる
export function timeRangesOverlap(
  aStart: string,
  aEnd: string | undefined,
  bStart: string,
  bEnd: string | undefined
): boolean {
  const aStartMin = timeToMinutes(aStart);
  const aEndMin = aEnd
    ? timeToMinutes(aEnd)
    : null;

  const bStartMin = timeToMinutes(bStart);
  const bEndMin = bEnd
    ? timeToMinutes(bEnd)
    : null;

  // 一点が区間に含まれるか
  // （開始ちょうどは含み、終了ちょうどは含まない）
  const pointInRange = (
    point: number,
    start: number,
    end: number
  ) => point >= start && point < end;

  if (aEndMin !== null && bEndMin !== null) {
    // 区間同士
    return (
      aStartMin < bEndMin &&
      bStartMin < aEndMin
    );
  }

  if (aEndMin !== null) {
    // Aが区間、Bが一点
    return pointInRange(
      bStartMin,
      aStartMin,
      aEndMin
    );
  }

  if (bEndMin !== null) {
    // Aが一点、Bが区間
    return pointInRange(
      aStartMin,
      bStartMin,
      bEndMin
    );
  }

  // 一点同士
  return aStartMin === bStartMin;
}

// 指定日に candidate と時間帯が重なる
// 別の予定を探す
// 重なる予定がなければ undefined
// 繰り返し予定は、その日に出現する
// 場合にだけ対象とする
export function findOverlappingTask(
  tasks: Task[],
  candidate: Task,
  date: string,
  excludeId?: string
): Task | undefined {
  // 時刻なしの予定は判定しない
  if (candidate.startTime === '') {
    return undefined;
  }

  // candidate 自身がその日に
  // 出現しなければ対象外
  if (!occursOn(candidate, date)) {
    return undefined;
  }

  return tasks.find((other) => {
    if (other.id === candidate.id) {
      return false;
    }

    if (
      excludeId !== undefined &&
      other.id === excludeId
    ) {
      return false;
    }

    if (other.startTime === '') {
      return false;
    }

    if (!occursOn(other, date)) {
      return false;
    }

    return timeRangesOverlap(
      candidate.startTime,
      candidate.endTime,
      other.startTime,
      other.endTime
    );
  });
}
