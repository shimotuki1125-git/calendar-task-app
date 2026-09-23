import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import TimePickerModal from '@/components/time-picker-modal';

type TaskAddFormProps = {
  onAdd: (
    title: string,
    startTime: string
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

  const [timePickerVisible, setTimePickerVisible] =
    useState(false);

  const handleAdd = () => {
    const trimmedTitle = title.trim();

    if (trimmedTitle === '') {
      return;
    }

    onAdd(
      trimmedTitle,
      time
    );

    setTitle('');
    setTime('');
  };

  const handleCancel = () => {
    setTitle('');
    setTime('');
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

        {/* 時刻 */}
        <Text style={styles.label}>
          時刻
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

      {/* 時刻ピッカー */}
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