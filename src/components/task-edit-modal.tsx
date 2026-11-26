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
import type { TaskOptions } from '@/contexts/task-context';
import { useTheme } from '@/hooks/use-theme';
import type { Recurrence, Task } from '@/types/task';

type TaskEditModalProps = {
  task: Task | null;

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
  onClose,
  onSave,
  onDelete,
}: TaskEditModalProps) {
  const theme = useTheme();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [memo, setMemo] = useState('');

  const [recurrence, setRecurrence] =
    useState<Recurrence | undefined>(undefined);

  // 予定名が未入力のまま保存しようとした
  const [titleError, setTitleError] =
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
      setDate(task.date);
      setTime(task.startTime);
      setEndTime(task.endTime ?? '');
      setMemo(task.memo ?? '');
      setRecurrence(task.recurrence);
    }
  }, [task]);

  // -----------------------------
  // 保存
  // -----------------------------

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

    onSave(
      task.id,
      trimmedTitle,
      date,
      time,
      {
        endTime: endTime || undefined,
        memo: memo.trim() || undefined,
        recurrence,
      }
    );

    onClose();
  };

  // -----------------------------
  // 削除
  // -----------------------------

  const handleDelete = () => {
    if (task === null) {
      return;
    }

    Alert.alert(
      '予定を削除',
      `「${task.title}」を削除しますか？`,
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

              {/* 日付 */}
              <Text style={labelStyle}>
                {recurrence ? '開始日' : '日付'}
              </Text>

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
                style={selectButtonStyle}
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

              {/* 繰り返し */}
              <Text style={labelStyle}>
                繰り返し
              </Text>

              <RecurrencePicker
                value={recurrence}
                onChange={setRecurrence}
              />

              {/* 繰り返し終了日 */}
              {recurrence && (
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
