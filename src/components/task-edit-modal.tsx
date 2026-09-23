import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import DatePickerModal from '@/components/date-picker-modal';
import TimePickerModal from '@/components/time-picker-modal';
import type { Task } from '@/types/task';

type TaskEditModalProps = {
  task: Task | null;

  onClose: () => void;

  onSave: (
    id: string,
    title: string,
    date: string,
    startTime: string
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
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const [
    datePickerVisible,
    setDatePickerVisible,
  ] = useState(false);

  const [
    timePickerVisible,
    setTimePickerVisible,
  ] = useState(false);

  // 編集する予定が変わったときに
  // 入力内容をセット
  useEffect(() => {
    if (task !== null) {
      setTitle(task.title);
      setDate(task.date);
      setTime(task.startTime);
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
      return;
    }

    onSave(
      task.id,
      trimmedTitle,
      date,
      time
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
          <View style={styles.modal}>
            <Text style={styles.title}>
              予定を編集
            </Text>

            {/* 予定名 */}
            <Text style={styles.label}>
              予定名
            </Text>

            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />

            {/* 日付 */}
            <Text style={styles.label}>
              日付
            </Text>

            <Pressable
              style={styles.selectButton}
              onPress={() =>
                setDatePickerVisible(true)
              }
            >
              <Text style={styles.selectText}>
                {formatDateLabel(date)}
              </Text>

              <Text style={styles.chevron}>
                ›
              </Text>
            </Pressable>

            {/* 時刻 */}
            <Text style={styles.label}>
              時刻
            </Text>

            <Pressable
              style={styles.selectButton}
              onPress={() =>
                setTimePickerVisible(true)
              }
            >
              <Text
                style={[
                  styles.selectText,
                  time === '' &&
                    styles.placeholderText,
                ]}
              >
                {time === ''
                  ? '時刻なし'
                  : time}
              </Text>

              <Text style={styles.chevron}>
                ›
              </Text>
            </Pressable>

            {/* 下部ボタン */}
            <View style={styles.buttons}>
              <Pressable
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Text style={styles.deleteText}>
                  削除
                </Text>
              </Pressable>

              <View style={styles.rightButtons}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={onClose}
                >
                  <Text>
                    キャンセル
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveText}>
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
          時刻ピッカー
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
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
  },

  title: {
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 22,
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

  selectButton: {
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

  selectText: {
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
    color: '#d32f2f',
    fontSize: 16,
  },

  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  saveButton: {
    backgroundColor: '#222222',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9,
  },

  saveText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});