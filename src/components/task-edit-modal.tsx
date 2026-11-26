import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import DatePickerModal from '@/components/date-picker-modal';
import RecurrencePicker from '@/components/recurrence-picker';
import TimePickerModal from '@/components/time-picker-modal';
import {
  useTasks,
  type TaskOptions,
} from '@/contexts/task-context';
import { useTheme } from '@/hooks/use-theme';
import type { Recurrence, Task } from '@/types/task';
import { isCompletedOn } from '@/utils/recurrence';
import { findOverlappingTask } from '@/utils/tasks';

type TaskEditModalProps = {
  task: Task | null;

  // 呼び出し側で表示されていた出現日
  // （今日タブ＝今日、カレンダー＝選択日、
  //   検索結果＝表示されていた日付）
  // 繰り返し予定の「この回だけ」操作に使う
  occurrenceDate?: string | null;

  onClose: () => void;

  onSave: (
    id: string,
    title: string,
    date: string,
    startTime: string,
    options: TaskOptions
  ) => void;

  onDelete: (id: string) => void;
};

// 繰り返し予定の適用範囲
type EditScope = 'once' | 'all';

// YYYY-MM-DD → YYYY年M月D日
function formatDateLabel(date: string) {
  const match = date.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return date;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return `${year}年${month}月${day}日`;
}

export default function TaskEditModal({
  task,
  occurrenceDate,
  onClose,
  onSave,
  onDelete,
}: TaskEditModalProps) {
  const theme = useTheme();

  const {
    tasks,
    addTaskObject,
    skipOccurrence,
  } = useTasks();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [memo, setMemo] = useState('');

  const [recurrence, setRecurrence] =
    useState<Recurrence | undefined>(undefined);

  // 繰り返し予定の適用範囲
  // （「この回だけ」か「すべての回」か）
  const [scope, setScope] =
    useState<EditScope>('all');

  // 予定名が未入力のまま保存しようとした
  const [titleError, setTitleError] =
    useState(false);

  // 終了時刻が開始時刻以前になっている
  const [endTimeError, setEndTimeError] =
    useState(false);

  const [
    datePickerVisible,
    setDatePickerVisible,
  ] = useState(false);

  const [
    untilPickerVisible,
    setUntilPickerVisible,
  ] = useState(false);

  const [
    timePickerVisible,
    setTimePickerVisible,
  ] = useState(false);

  const [
    endTimePickerVisible,
    setEndTimePickerVisible,
  ] = useState(false);

  // 編集する予定が変わったときに
  // 入力内容をセット
  useEffect(() => {
    if (task !== null) {
      setTitle(task.title);
      setTitleError(false);
      setEndTimeError(false);
      setDate(task.date);
      setTime(task.startTime);
      setEndTime(task.endTime ?? '');
      setMemo(task.memo ?? '');
      setRecurrence(task.recurrence);

      // 出現日（開始日以外）から開いた
      // 繰り返し予定は「この回だけ」を
      // 初期値にする
      setScope(
        task.recurrence &&
          occurrenceDate &&
          occurrenceDate !== task.date
          ? 'once'
          : 'all'
      );
    }
  }, [task, occurrenceDate]);

  // 繰り返し予定を特定の出現日から
  // 開いた場合のみ、適用範囲を選べる
  const canChooseScope =
    task !== null &&
    !!task.recurrence &&
    !!occurrenceDate;

  const isOnceScope =
    canChooseScope && scope === 'once';

  // -----------------------------
  // 保存
  // -----------------------------

  // 実際の保存処理
  // （重なり警告で「保存する」を選んだ
  //   場合もここを通る）
  const performSave = (
    trimmedTitle: string
  ) => {
    if (task === null) {
      return;
    }

    const options: TaskOptions = {
      endTime: endTime || undefined,
      memo: memo.trim() || undefined,
      recurrence,
    };

    if (isOnceScope && occurrenceDate) {
      // 「この回だけ」：元の予定の出現を
      // スキップし、フォーム内容で
      // 単発予定を作成する
      const wasCompleted = isCompletedOn(
        task,
        occurrenceDate
      );

      skipOccurrence(
        task.id,
        occurrenceDate,
        { removeCompleted: wasCompleted }
      );

      addTaskObject({
        id: Date.now().toString(),
        title: trimmedTitle,
        date: occurrenceDate,
        startTime: time,
        endTime: endTime || undefined,
        memo: memo.trim() || undefined,
        completed: wasCompleted,
      });
    } else {
      onSave(
        task.id,
        trimmedTitle,
        date,
        time,
        options
      );
    }

    onClose();
  };

  const handleSave = () => {
    if (task === null) {
      return;
    }

    const trimmedTitle = title.trim();

    if (trimmedTitle === '') {
      // 無反応だと分かりにくいので
      // 入力欄にエラーを表示する
      setTitleError(true);
      return;
    }

    // 開始・終了の両方が設定されていて
    // 終了時刻が開始時刻以前なら保存しない
    if (
      time !== '' &&
      endTime !== '' &&
      endTime <= time
    ) {
      setEndTimeError(true);
      return;
    }

    // 既存チェックを通った後に、
    // 同じ日に重なる予定がないか確認する
    const candidate: Task = isOnceScope &&
      occurrenceDate
      ? {
          ...task,
          title: trimmedTitle,
          date: occurrenceDate,
          startTime: time,
          endTime: endTime || undefined,
          memo: memo.trim() || undefined,
          recurrence: undefined,
          completedDates: undefined,
          skippedDates: undefined,
        }
      : {
          ...task,
          title: trimmedTitle,
          date,
          startTime: time,
          endTime: endTime || undefined,
          memo: memo.trim() || undefined,
          recurrence,
        };

    const checkDate =
      occurrenceDate ?? date;

    const overlapping = findOverlappingTask(
      tasks,
      candidate,
      checkDate,
      task.id
    );

    if (overlapping) {
      Alert.alert(
        '予定が重なっています',
        'このまま保存しますか？',
        [
          {
            text: 'キャンセル',
            style: 'cancel',
          },
          {
            text: '保存する',
            onPress: () =>
              performSave(trimmedTitle),
          },
        ]
      );
      return;
    }

    performSave(trimmedTitle);
  };

  // -----------------------------
  // 削除
  // -----------------------------

  const handleDelete = () => {
    if (task === null) {
      return;
    }

    // 繰り返し予定を特定の出現日から
    // 開いた場合は、削除範囲を選べる
    if (canChooseScope && occurrenceDate) {
      Alert.alert(
        '予定を削除',
        `「${task.title}」を削除しますか？` +
          '「すべての回を削除」を選ぶと、' +
          '繰り返しの予定全体が削除されます。',
        [
          {
            text: 'この回だけ削除',
            onPress: () => {
              skipOccurrence(
                task.id,
                occurrenceDate
              );
              onClose();
            },
          },
          {
            text: 'すべての回を削除',
            style: 'destructive',
            onPress: () => {
              onDelete(task.id);
              onClose();
            },
          },
          {
            text: 'キャンセル',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    Alert.alert(
      '予定を削除',
      task.recurrence
        ? `「${task.title}」を削除しますか？` +
          '繰り返しの予定全体が削除されます。'
        : `「${task.title}」を削除しますか？`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            onDelete(task.id);
            onClose();
          },
        },
      ]
    );
  };

  // テーマ色を適用した共通スタイル
  const labelStyle = [
    styles.label,
    { color: theme.textSecondary },
  ];

  const inputColors = {
    backgroundColor: theme.inputBackground,
    borderColor: theme.border,
    color: theme.text,
  };

  const selectButtonStyle = [
    styles.selectButton,
    {
      backgroundColor: theme.inputBackground,
      borderColor: theme.border,
    },
  ];

  // 終了時刻エラー時は赤枠にする
  const endTimeButtonStyle = endTimeError
    ? [
        ...selectButtonStyle,
        styles.inputError,
        { borderColor: theme.error },
      ]
    : selectButtonStyle;

  const selectTextStyle = (
    isPlaceholder: boolean
  ) => [
    styles.selectText,
    { color: theme.text },
    isPlaceholder && { color: theme.textTertiary },
  ];

  const chevronStyle = [
    styles.chevron,
    { color: theme.textTertiary },
  ];

  return (
    <>
      {/* =========================
          編集画面
      ========================== */}

      <Modal
        visible={task !== null}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalBackground}>
          <View
            style={[
              styles.modal,
              { backgroundColor: theme.background },
            ]}
          >
            <Text
              style={[
                styles.title,
                { color: theme.text },
              ]}
            >
              予定を編集
            </Text>

            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
            >
              {/* 予定名 */}
              <Text style={labelStyle}>
                予定名
              </Text>

              <TextInput
                style={[
                  styles.input,
                  inputColors,
                  titleError && [
                    styles.inputError,
                    { borderColor: theme.error },
                  ],
                ]}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);

                  if (text.trim() !== '') {
                    setTitleError(false);
                  }
                }}
              />

              {titleError && (
                <Text
                  style={[
                    styles.errorText,
                    { color: theme.error },
                  ]}
                >
                  予定名を入力してください
                </Text>
              )}

              {/* 適用範囲
                  （繰り返し予定を出現日から
                    開いた場合のみ） */}
              {canChooseScope && (
                <>
                  <Text style={labelStyle}>
                    適用範囲
                  </Text>

                  <View style={styles.scopeRow}>
                    {(
                      [
                        {
                          value: 'once',
                          label: 'この回だけ',
                        },
                        {
                          value: 'all',
                          label: 'すべての回',
                        },
                      ] as {
                        value: EditScope;
                        label: string;
                      }[]
                    ).map((option) => {
                      const selected =
                        scope === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          style={[
                            styles.scopeChip,
                            {
                              borderColor:
                                theme.border,
                              backgroundColor:
                                theme.inputBackground,
                            },
                            selected && {
                              backgroundColor:
                                theme.accent,
                              borderColor:
                                theme.accent,
                            },
                          ]}
                          onPress={() =>
                            setScope(option.value)
                          }
                        >
                          <Text
                            style={[
                              styles.scopeChipText,
                              {
                                color:
                                  theme.textSecondary,
                              },
                              selected && [
                                styles
                                  .scopeChipTextSelected,
                                {
                                  color:
                                    theme.accentText,
                                },
                              ],
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {/* 日付
                  「この回だけ」の場合は出現日に
                  固定し、変更できない */}
              <Text style={labelStyle}>
                {isOnceScope
                  ? '日付'
                  : recurrence
                    ? '開始日'
                    : '日付'}
              </Text>

              {isOnceScope && occurrenceDate ? (
                <View style={selectButtonStyle}>
                  <Text
                    style={selectTextStyle(false)}
                  >
                    {formatDateLabel(
                      occurrenceDate
                    )}
                  </Text>
                </View>
              ) : (
                <Pressable
                  style={selectButtonStyle}
                  onPress={() =>
                    setDatePickerVisible(true)
                  }
                >
                  <Text
                    style={selectTextStyle(false)}
                  >
                    {formatDateLabel(date)}
                  </Text>

                  <Text style={chevronStyle}>
                    ›
                  </Text>
                </Pressable>
              )}

              {/* 開始時刻 */}
              <Text style={labelStyle}>
                開始時刻
              </Text>

              <Pressable
                style={selectButtonStyle}
                onPress={() =>
                  setTimePickerVisible(true)
                }
              >
                <Text
                  style={selectTextStyle(
                    time === ''
                  )}
                >
                  {time === ''
                    ? '時刻なし'
                    : time}
                </Text>

                <Text style={chevronStyle}>
                  ›
                </Text>
              </Pressable>

              {/* 終了時刻 */}
              <Text style={labelStyle}>
                終了時刻
              </Text>

              <Pressable
                style={endTimeButtonStyle}
                onPress={() =>
                  setEndTimePickerVisible(true)
                }
              >
                <Text
                  style={selectTextStyle(
                    endTime === ''
                  )}
                >
                  {endTime === ''
                    ? '時刻なし'
                    : endTime}
                </Text>

                <Text style={chevronStyle}>
                  ›
                </Text>
              </Pressable>

              {endTimeError && (
                <Text
                  style={[
                    styles.errorText,
                    { color: theme.error },
                  ]}
                >
                  終了時刻は開始時刻より後にしてください
                </Text>
              )}

              {/* 繰り返し
                  「この回だけ」の場合は
                  単発予定になるため表示しない */}
              {!isOnceScope && (
                <>
                  <Text style={labelStyle}>
                    繰り返し
                  </Text>

                  <RecurrencePicker
                    value={recurrence}
                    onChange={setRecurrence}
                  />
                </>
              )}

              {/* 繰り返し終了日 */}
              {!isOnceScope && recurrence && (
                <>
                  <Text style={labelStyle}>
                    繰り返し終了日
                  </Text>

                  <View style={styles.untilRow}>
                    <Pressable
                      style={[
                        ...selectButtonStyle,
                        styles.untilButton,
                      ]}
                      onPress={() =>
                        setUntilPickerVisible(true)
                      }
                    >
                      <Text
                        style={selectTextStyle(
                          !recurrence.until
                        )}
                      >
                        {recurrence.until
                          ? formatDateLabel(
                              recurrence.until
                            )
                          : '無期限'}
                      </Text>

                      <Text style={chevronStyle}>
                        ›
                      </Text>
                    </Pressable>

                    {recurrence.until && (
                      <Pressable
                        style={styles.clearButton}
                        onPress={() =>
                          setRecurrence({
                            ...recurrence,
                            until: undefined,
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.clearText,
                            {
                              color:
                                theme.textSecondary,
                            },
                          ]}
                        >
                          解除
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </>
              )}

              {/* メモ */}
              <Text style={labelStyle}>
                メモ
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.memoInput,
                  inputColors,
                ]}
                value={memo}
                onChangeText={setMemo}
                placeholder="メモ（任意）"
                placeholderTextColor={
                  theme.textTertiary
                }
                multiline
              />
            </ScrollView>

            {/* 下部ボタン */}
            <View style={styles.buttons}>
              <Pressable
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Text
                  style={[
                    styles.deleteText,
                    { color: theme.danger },
                  ]}
                >
                  削除
                </Text>
              </Pressable>

              <View style={styles.rightButtons}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={onClose}
                >
                  <Text
                    style={{
                      color: theme.textSecondary,
                    }}
                  >
                    キャンセル
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor: theme.accent,
                    },
                  ]}
                  onPress={handleSave}
                >
                  <Text
                    style={[
                      styles.saveText,
                      { color: theme.accentText },
                    ]}
                  >
                    保存
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* =========================
          日付ピッカー
      ========================== */}

      <DatePickerModal
        visible={datePickerVisible}
        value={date}
        onClose={() =>
          setDatePickerVisible(false)
        }
        onConfirm={(selectedDate) => {
          setDate(selectedDate);
        }}
      />

      {/* =========================
          繰り返し終了日ピッカー
      ========================== */}

      <DatePickerModal
        visible={untilPickerVisible}
        value={recurrence?.until ?? date}
        onClose={() =>
          setUntilPickerVisible(false)
        }
        onConfirm={(selectedDate) => {
          if (recurrence) {
            setRecurrence({
              ...recurrence,
              until: selectedDate,
            });
          }
        }}
      />

      {/* =========================
          開始時刻ピッカー
      ========================== */}

      <TimePickerModal
        visible={timePickerVisible}
        value={time}
        onClose={() =>
          setTimePickerVisible(false)
        }
        onConfirm={(selectedTime) => {
          setTime(selectedTime);
          setEndTimeError(false);
        }}
      />

      {/* =========================
          終了時刻ピッカー
      ========================== */}

      <TimePickerModal
        visible={endTimePickerVisible}
        value={endTime}
        onClose={() =>
          setEndTimePickerVisible(false)
        }
        onConfirm={(selectedTime) => {
          setEndTime(selectedTime);
          setEndTimeError(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  modal: {
    borderRadius: 18,
    padding: 20,
    maxHeight: '88%',
  },

  scroll: {
    flexShrink: 1,
  },

  title: {
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 22,
  },

  label: {
    fontSize: 14,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 14,
    fontSize: 16,
  },

  inputError: {
    marginBottom: 6,
  },

  errorText: {
    fontSize: 13,
    marginBottom: 14,
  },

  memoInput: {
    minHeight: 68,
    textAlignVertical: 'top',
  },

  selectButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 14,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectText: {
    fontSize: 16,
  },

  chevron: {
    fontSize: 24,
  },

  // 適用範囲の切り替え
  // （繰り返しピッカーと同じ見た目）
  scopeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },

  scopeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  scopeChipText: {
    fontSize: 14,
  },

  scopeChipTextSelected: {
    fontWeight: '600',
  },

  untilRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  untilButton: {
    flex: 1,
  },

  clearButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  clearText: {
    fontSize: 15,
  },

  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },

  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  deleteText: {
    fontSize: 16,
  },

  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9,
  },

  saveText: {
    fontWeight: '600',
  },
});
