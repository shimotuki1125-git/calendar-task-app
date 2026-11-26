import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import RecurrencePicker from '@/components/recurrence-picker';
import TimePickerModal from '@/components/time-picker-modal';
import type { TaskOptions } from '@/contexts/task-context';
import type { Recurrence } from '@/types/task';

type TaskAddFormProps = {
  onAdd: (
    title: string,
    startTime: string,
    options: TaskOptions
  ) => void;

  onCancel: () => void;

  showTitle?: boolean;
};

export default function TaskAddForm({
  onAdd,
  onCancel,
  showTitle = true,
}: TaskAddFormProps) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [memo, setMemo] = useState('');

  const [recurrence, setRecurrence] =
    useState<Recurrence | undefined>(undefined);

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
  };

  const handleAdd = () => {
    const trimmedTitle = title.trim();

    if (trimmedTitle === '') {
      return;
    }

    onAdd(trimmedTitle, time, {
      endTime: endTime || undefined,
      memo: memo.trim() || undefined,
      recurrence,
    });

    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <>
      <View style={styles.form}>
        {showTitle && (
          <Text style={styles.formTitle}>
            新しい予定
          </Text>
        )}

        {/* 予定名 */}
        <Text style={styles.label}>
          予定名
        </Text>

        <TextInput
          style={styles.input}
          placeholder="予定名"
          value={title}
          onChangeText={setTitle}
        />

        {/* 開始時刻 */}
        <Text style={styles.label}>
          開始時刻
        </Text>

        <Pressable
          style={styles.timeButton}
          onPress={() =>
            setTimePickerVisible(true)
          }
        >
          <Text
            style={[
              styles.timeText,
              time === '' &&
                styles.placeholderText,
            ]}
          >
            {time === ''
              ? '時刻を選択'
              : time}
          </Text>

          <Text style={styles.chevron}>
            ›
          </Text>
        </Pressable>

        {/* 終了時刻 */}
        <Text style={styles.label}>
          終了時刻
        </Text>

        <Pressable
          style={styles.timeButton}
          onPress={() =>
            setEndTimePickerVisible(true)
          }
        >
          <Text
            style={[
              styles.timeText,
              endTime === '' &&
                styles.placeholderText,
            ]}
          >
            {endTime === ''
              ? '時刻を選択（任意）'
              : endTime}
          </Text>

          <Text style={styles.chevron}>
            ›
          </Text>
        </Pressable>

        {/* 繰り返し */}
        <Text style={styles.label}>
          繰り返し
        </Text>

        <RecurrencePicker
          value={recurrence}
          onChange={setRecurrence}
        />

        {/* メモ */}
        <Text style={styles.label}>
          メモ
        </Text>

        <TextInput
          style={[styles.input, styles.memoInput]}
          placeholder="メモ（任意）"
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
            <Text>
              キャンセル
            </Text>
          </Pressable>

          <Pressable
            style={styles.addButton}
            onPress={handleAdd}
          >
            <Text style={styles.addButtonText}>
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
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 18,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
  },

  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
  },

  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 14,
    fontSize: 16,
  },

  memoInput: {
    minHeight: 68,
    textAlignVertical: 'top',
  },

  timeButton: {
    minHeight: 48,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 14,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timeText: {
    fontSize: 16,
    color: '#222222',
  },

  placeholderText: {
    color: '#999999',
  },

  chevron: {
    fontSize: 24,
    color: '#aaaaaa',
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
    backgroundColor: '#222222',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9,
  },

  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
