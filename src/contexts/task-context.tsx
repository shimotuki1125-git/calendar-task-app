import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { ReactNode } from 'react';

import { useSettings } from '@/contexts/settings-context';
import { syncTaskNotifications } from '@/notifications/task-notifications';
import {
  loadTasks,
  saveTasks,
} from '@/storage/task-storage';

import type {
  Recurrence,
  Task,
} from '@/types/task';

// 予定の追加・編集時に指定できる項目
export type TaskOptions = {
  endTime?: string;
  memo?: string;
  recurrence?: Recurrence;
};

type TaskContextType = {
  tasks: Task[];
  isLoaded: boolean;

  addTask: (
    title: string,
    date: string,
    startTime: string,
    options?: TaskOptions
  ) => void;

  // date を渡すと、その日付の完了状態を
  // 切り替える（繰り返し予定用）
  // 省略した場合は予定全体の完了状態を切り替える
  toggleTask: (id: string, date?: string) => void;

  updateTask: (
    id: string,
    title: string,
    date: string,
    startTime: string,
    options?: TaskOptions
  ) => void;

  deleteTask: (id: string) => void;

  // バックアップの読み込み用：
  // 予定をすべて置き換える
  // （保存と通知の同期は既存の仕組みで連動する）
  replaceTasks: (tasks: Task[]) => void;
};

const TaskContext =
  createContext<TaskContextType | undefined>(
    undefined
  );

export function TaskProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [isLoaded, setIsLoaded] =
    useState(false);

  const {
    notificationsEnabled,
    isLoaded: isSettingsLoaded,
  } = useSettings();

  // 保存されている予定を読み込む
  useEffect(() => {
    const initializeTasks = async () => {
      const savedTasks = await loadTasks();

      setTasks(savedTasks);
      setIsLoaded(true);
    };

    initializeTasks();
  }, []);

  // 予定が変更されたら保存
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveTasks(tasks);
  }, [tasks, isLoaded]);

  // 予定や通知設定が変更されたら
  // 通知スケジュールを同期する
  // （追加・編集・削除・完了すべてに連動）
  useEffect(() => {
    if (!isLoaded || !isSettingsLoaded) {
      return;
    }

    syncTaskNotifications(
      tasks,
      notificationsEnabled
    );
  }, [
    tasks,
    isLoaded,
    notificationsEnabled,
    isSettingsLoaded,
  ]);

  // -----------------------------
  // 予定を追加
  // -----------------------------

  const addTask = (
    title: string,
    date: string,
    startTime: string,
    options?: TaskOptions
  ) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      date,
      startTime,
      completed: false,
      endTime: options?.endTime || undefined,
      memo: options?.memo || undefined,
      recurrence: options?.recurrence,
      completedDates: options?.recurrence
        ? []
        : undefined,
    };

    setTasks((currentTasks) => [
      ...currentTasks,
      newTask,
    ]);
  };

  // -----------------------------
  // 完了 / 未完了を切り替え
  // -----------------------------

  const toggleTask = (id: string, date?: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== id) {
          return task;
        }

        // 繰り返し予定は日付ごとに
        // 完了状態を管理する
        if (task.recurrence && date) {
          const completedDates =
            task.completedDates ?? [];

          const nextCompletedDates =
            completedDates.includes(date)
              ? completedDates.filter(
                  (completedDate) =>
                    completedDate !== date
                )
              : [...completedDates, date];

          return {
            ...task,
            completedDates: nextCompletedDates,
          };
        }

        return {
          ...task,
          completed: !task.completed,
        };
      })
    );
  };

  // -----------------------------
  // 予定を編集
  // -----------------------------

  const updateTask = (
    id: string,
    title: string,
    date: string,
    startTime: string,
    options?: TaskOptions
  ) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== id) {
          return task;
        }

        const wasRecurring = !!task.recurrence;
        const isRecurring = !!options?.recurrence;

        return {
          ...task,
          title,
          date,
          startTime,
          endTime:
            options?.endTime || undefined,
          memo: options?.memo || undefined,
          recurrence: options?.recurrence,

          // 繰り返しでなくなった場合は
          // 日付ごとの完了状態を破棄する
          // 新しく繰り返しになった場合は
          // 空の一覧から始める
          completedDates: isRecurring
            ? (wasRecurring
                ? task.completedDates
                : [])
            : undefined,
        };
      })
    );
  };

  // -----------------------------
  // 予定を削除
  // -----------------------------

  const deleteTask = (id: string) => {
    setTasks((currentTasks) =>
      currentTasks.filter(
        (task) => task.id !== id
      )
    );
  };

  // -----------------------------
  // 予定をすべて置き換え
  // -----------------------------

  const replaceTasks = (nextTasks: Task[]) => {
    setTasks(nextTasks);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoaded,
        addTask,
        toggleTask,
        updateTask,
        deleteTask,
        replaceTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);

  if (context === undefined) {
    throw new Error(
      'useTasks must be used inside TaskProvider'
    );
  }

  return context;
}
