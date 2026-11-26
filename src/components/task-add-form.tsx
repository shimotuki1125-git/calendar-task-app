import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import RecurrencePicker from '@/components/recurrence-picker';
import TimePickerModal from '@/components/time-picker-modal';
import {
  useTasks,
  type TaskOptions,
} from '@/contexts/task-context';
import { useTheme } from '@/hooks/use-theme';
import type { Recurrence, Task } from '@/types/task';
import { findOverlappingTask } from '@/utils/tasks';

type TaskAddFormProps = {
  onAdd: (
    title: string,
    startTime: string,
    options: TaskOptions
  ) => void;

  onCancel: () => void;

  showTitle?: boolean;

  // 追加対象の日付 (YYYY-MM-DD)
  // 予定の重なり判定に使う
  date: string;
};

export default function TaskAddForm({
  onAdd,
  onCancel,
  showTitle = true,
  date,
}: TaskAddFormProps) {
  const theme = useTheme();

  const { tasks } = useTasks();

  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [memo, setMemo] = useState('');

  const [recurrence, setRecurrence] =
    useState<Recurrence | undefined>(undefined);

  // 予定名が未入力のまま追加しようとした
  const [titleError, setTitleError] =
    useState(false);

  // 終了時刻が開始時刻以前になっている
  const [endTimeError, setEndTimeError] =
    useState(false);

  const [timePickerVisible, setTimePickerVisible] =
    useState(false);

  const [
    endTimePickerVisible,
    setEndTimePickerVisible,
  ] = useState(false);

  const resetForm = () => {
    setTitle('');
    setTime('');
    setEndTime('');
    setMemo('');
    setRecurrence(undefined);
    setTitleError(false);
    setEndTimeError(false);
  };

  // 実際の追加処理
  // （重なり警告で「保存する」を選んだ
  //   場合もここを通る）
  const performAdd = (trimmedTitle: string) => {
    onAdd(trimmedTitle, time, {
      endTime: endTime || undefined,
      memo: memo.trim() || undefined,
      recurrence,
    });

    resetForm();
  };

  const handleAdd = () => {
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
    // 追加日に重なる予定がないか確認する
    const candidate: Task = {
      id: '',
      title: trimmedTitle,
      date,
      startTime: time,
      endTime: endTime || undefined,
      memo: memo.trim() || undefined,
      completed: false,
      recurrence,
    };

    const overlapping = findOverlappingTask(
      tasks,
      candidate,
      date
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
              performAdd(trimmedTitle),
          },
        ]
      );
      return;
    }

    performAdd(trimmedTitle);
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <>
      <View
        style={[
          styles.form,
          { backgroundColor: theme.surface },
        ]}
      >
        {showTitle && (
          <Text
            style={[
              styles.formTitle,
              { color: theme.text },
            ]}
          >
            新しい予定
          </Text>
        )}

        {/* 予定名 */}
        <Text
          style={[
            styles.label,
            { color: theme.textSecondary },
          ]}
        >
          予定名
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
              color: theme.text,
            },
            titleError && [
              styles.inputError,
              { borderColor: theme.error },
            ],
          ]}
          placeholder="予定名"
          placeholderTextColor={theme.textTertiary}
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

        {/* 開始時刻 */}
        <Text
          style={[
            styles.label,
            { color: theme.textSecondary },
          ]}
        >
          開始時刻
        </Text>

        <Pressable
          style={[
            styles.timeButton,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
            },
          ]}
          onPress={() =>
            setTimePickerVisible(true)
          }
        >
          <Text
            style={[
              styles.timeText,
              { color: theme.text },
              time === '' && {
                color: theme.textTertiary,
              },
            ]}
          >
            {time === ''
              ? '時刻を選択'
              : time}
          </Text>

          <Text
            style={[
              styles.chevron,
              { color: theme.textTertiary },
            ]}
          >
            ›
          </Text>
        </Pressable>

        {/* 終了時刻 */}
        <Text
          style={[
            styles.label,
            { color: theme.textSecondary },
          ]}
        >
          終了時刻
        </Text>

        <Pressable
          style={[
            styles.timeButton,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
            },
            endTimeError && [
              styles.timeButtonError,
              { borderColor: theme.error },
            ],
          ]}
          onPress={() =>
            setEndTimePickerVisible(true)
          }
        >
          <Text
            style={[
              styles.timeText,
              { color: theme.text },
              endTime === '' && {
                color: theme.textTertiary,
              },
            ]}
          >
            {endTime === ''
              ? '時刻を選択（任意）'
              : endTime}
          </Text>

          <Text
            style={[
              styles.chevron,
              { color: theme.textTertiary },
            ]}
          >
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

        {/* 繰り返し */}
        <Text
          style={[
            styles.label,
            { color: theme.textSecondary },
          ]}
        >
          繰り返し
        </Text>

        <RecurrencePicker
          value={recurrence}
          onChange={setRecurrence}
        />

        {/* メモ */}
        <Text
          style={[
            styles.label,
            { color: theme.textSecondary },
          ]}
        >
          メモ
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.memoInput,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="メモ（任意）"
          placeholderTextColor={theme.textTertiary}
          value={memo}
          onChangeText={setMemo}
          multiline
        />

        {/* ボタン */}
        <View style={styles.buttons}>
          <Pressable
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={{ color: theme.textSecondary }}>
              キャンセル
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.addButton,
              { backgroundColor: theme.accent },
            ]}
            onPress={handleAdd}
          >
            <Text
              style={[
                styles.addButtonText,
                { color: theme.accentText },
              ]}
            >
              追加
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 開始時刻ピッカー */}
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

      {/* 終了時刻ピッカー */}
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
  form: {
    padding: 18,
    borderRadius: 16,
  },

  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
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

  timeButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 14,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timeButtonError: {
    marginBottom: 6,
  },

  timeText: {
    fontSize: 16,
  },

  chevron: {
    fontSize: 24,
  },

  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },

  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9,
  },

  addButtonText: {
    fontWeight: '600',
  },
});
