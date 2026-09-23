import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TaskAddForm from '@/components/task-add-form';
import TaskEditModal from '@/components/task-edit-modal';
import TaskRow from '@/components/task-row';
import { useTasks } from '@/contexts/task-context';
import type { Task } from '@/types/task';

export default function HomeScreen() {
  const {
    tasks,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
  } = useTasks();

  const now = new Date();

  const today =
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0');

  const weekdays = [
    '日',
    '月',
    '火',
    '水',
    '木',
    '金',
    '土',
  ];

  const dateLabel =
    `${now.getMonth() + 1}月${now.getDate()}日` +
    `（${weekdays[now.getDay()]}）`;

  // 予定追加フォーム
  const [showForm, setShowForm] =
    useState(false);

  // 編集中の予定
  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  // 今日の予定
  const todayTasks = tasks.filter(
    (task) => task.date === today
  );

  // 未完了
  const incompleteTasks = todayTasks.filter(
    (task) => !task.completed
  );

  // 完了
  const completedTasks = todayTasks.filter(
    (task) => task.completed
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 日付 */}
      <Text style={styles.date}>
        {dateLabel}
      </Text>

      {/* 今日の予定 */}
      <Text style={styles.sectionTitle}>
        今日の予定
      </Text>

      <View style={styles.line} />

      {incompleteTasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onToggle={() =>
            toggleTask(task.id)
          }
          onEdit={() =>
            setEditingTask(task)
          }
        />
      ))}

      {/* 完了 */}
      <Text
        style={[
          styles.sectionTitle,
          styles.completedSection,
        ]}
      >
        完了
      </Text>

      <View style={styles.line} />

      {completedTasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onToggle={() =>
            toggleTask(task.id)
          }
          onEdit={() =>
            setEditingTask(task)
          }
        />
      ))}

      {/* 予定追加フォーム */}
      {showForm && (
        <View style={styles.formContainer}>
          <TaskAddForm
            onAdd={(title, time) => {
              addTask(
                title,
                today,
                time
              );

              setShowForm(false);
            }}
            onCancel={() =>
              setShowForm(false)
            }
          />
        </View>
      )}

      {/* ＋ボタン */}
      {!showForm && (
        <Pressable
          style={styles.floatingButton}
          onPress={() =>
            setShowForm(true)
          }
        >
          <Text style={styles.plus}>
            ＋
          </Text>
        </Pressable>
      )}

      {/* 編集画面 */}
      <TaskEditModal
        task={editingTask}
        onClose={() =>
          setEditingTask(null)
        }
        onSave={updateTask}
        onDelete={deleteTask}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  date: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 36,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },

  line: {
    height: 1,
    backgroundColor: '#dddddd',
    marginTop: 8,
    marginBottom: 8,
  },

  completedSection: {
    marginTop: 28,
  },

  // 予定追加フォームの位置
  formContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 30,
  },

  // ＋ボタン
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 30,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },

  plus: {
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 36,
  },
});