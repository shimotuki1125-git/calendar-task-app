import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Task } from '@/types/task';

type TaskRowProps = {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
};

export default function TaskRow({
  task,
  onToggle,
  onEdit,
}: TaskRowProps) {
  const timeLabel = task.startTime
    ? task.endTime
      ? `${task.startTime}〜${task.endTime}`
      : task.startTime
    : '―';

  return (
    <View style={styles.task}>
      {/* チェックボックス */}
      <Pressable
        style={styles.checkboxButton}
        onPress={onToggle}
      >
        <Text style={styles.checkbox}>
          {task.completed ? '✓' : '□'}
        </Text>
      </Pressable>

      {/* 時刻・予定名 */}
      <Pressable
        style={styles.taskContent}
        onPress={onEdit}
      >
        <Text style={styles.time}>
          {timeLabel}
        </Text>

        <View style={styles.titleArea}>
          <Text
            style={[
              styles.taskTitle,
              task.completed &&
                styles.completedTask,
            ]}
          >
            {task.title}
            {task.recurrence ? '  ↻' : ''}
          </Text>

          {!!task.memo && (
            <Text
              style={styles.memo}
              numberOfLines={1}
            >
              {task.memo}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },

  checkboxButton: {
    width: 32,
    minHeight: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  checkbox: {
    fontSize: 22,
  },

  taskContent: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },

  time: {
    width: 118,
    fontSize: 14,
    color: '#555555',
  },

  titleArea: {
    flex: 1,
  },

  taskTitle: {
    fontSize: 17,
  },

  memo: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },

  completedTask: {
    color: '#888888',
    textDecorationLine: 'line-through',
  },
});
