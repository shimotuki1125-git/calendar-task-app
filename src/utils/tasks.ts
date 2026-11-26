import type { Task } from '@/types/task';

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
// （検索結果の表示用）
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
