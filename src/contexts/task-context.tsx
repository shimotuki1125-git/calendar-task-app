import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { ReactNode } from 'react';

import {
  loadTasks,
  saveTasks,
} from '@/storage/task-storage';

import type { Task } from '@/types/task';

type TaskContextType = {
  tasks: Task[];
  isLoaded: boolean;

  addTask: (
    title: string,
    date: string,
    startTime: string
  ) => void;

  toggleTask: (id: string) => void;

  updateTask: (
    id: string,
    title: string,
    date: string,
    startTime: string
  ) => void;

  deleteTask: (id: string) => void;
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

  // -----------------------------
  // 予定を追加
  // -----------------------------

  const addTask = (
    title: string,
    date: string,
    startTime: string
  ) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      date,
      startTime,
      completed: false,
    };

    setTasks((currentTasks) => [
      ...currentTasks,
      newTask,
    ]);
  };

  // -----------------------------
  // 完了 / 未完了を切り替え
  // -----------------------------

  const toggleTask = (id: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
            }
          : task
      )
    );
  };

  // -----------------------------
  // 予定を編集
  // -----------------------------

  const updateTask = (
    id: string,
    title: string,
    date: string,
    startTime: string
  ) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              title,
              date,
              startTime,
            }
          : task
      )
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

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoaded,
        addTask,
        toggleTask,
        updateTask,
        deleteTask,
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