export type RecurrenceFreq =
  | 'daily'
  | 'weekly'
  | 'monthly';

export type Recurrence = {
  freq: RecurrenceFreq;

  // 繰り返しの終了日 (YYYY-MM-DD)
  // 未設定の場合は無期限に繰り返す
  until?: string;
};

export type Task = {
  id: string;

  // 日付 (YYYY-MM-DD)
  // 繰り返しの場合は開始日
  date: string;

  // 開始時刻 (HH:mm)
  // 空文字の場合は時刻なし
  startTime: string;

  // 終了時刻 (HH:mm)
  endTime?: string;

  title: string;

  // メモ
  memo?: string;

  // 完了状態（繰り返しでない予定用）
  completed: boolean;

  // 繰り返しルール
  recurrence?: Recurrence;

  // 繰り返し予定の日付ごとの完了状態
  // 完了した日付 (YYYY-MM-DD) の一覧
  completedDates?: string[];

  // 繰り返し予定で「この回だけ」削除・分離した日付
  // この日付 (YYYY-MM-DD) には出現しない
  skippedDates?: string[];
};
