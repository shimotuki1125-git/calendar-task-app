import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { Task } from '@/types/task';

type TaskRowProps = {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;

  // 日付を添えて表示したい場合に指定する
  // （今日タブの「期限切れ」欄など）
  dateLabel?: string;
};

export default function TaskRow({
  task,
  onToggle,
  onEdit,
  dateLabel,
}: TaskRowProps) {
  const theme = useTheme();

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
        <Text
          style={[
            styles.checkbox,
            { color: theme.text },
          ]}
        >
          {task.completed ? '✓' : '□'}
        </Text>
      </Pressable>

      {/* 時刻・予定名 */}
      <Pressable
        style={styles.taskContent}
        onPress={onEdit}
      >
        <Text
          style={[
            styles.time,
            { color: theme.textSecondary },
          ]}
        >
          {timeLabel}
        </Text>

        <View style={styles.titleArea}>
          {!!dateLabel && (
            <Text
              style={[
                styles.dateLabel,
                { color: theme.error },
              ]}
            >
              {dateLabel}
            </Text>
          )}

          <Text
            style={[
              styles.taskTitle,
              { color: theme.text },
              task.completed && [
                styles.completedTask,
                { color: theme.textTertiary },
              ],
            ]}
          >
            {task.title}
            {task.recurrence ? '  ↻' : ''}
          </Text>

          {!!task.memo && (
            <Text
              style={[
                styles.memo,
                { color: theme.textTertiary },
              ]}
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

  // タップ領域を広げて押しやすくする
  checkboxButton: {
    width: 44,
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
  },

  titleArea: {
    flex: 1,
  },

  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },

  taskTitle: {
    fontSize: 17,
  },

  memo: {
    fontSize: 13,
    marginTop: 2,
  },

  completedTask: {
    textDecorationLine: 'line-through',
  },
});
