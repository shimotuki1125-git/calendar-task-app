import AsyncStorage from '@react-native-async-storage/async-storage';

import { Task } from '@/types/task';

const TASKS_KEY = 'tasks';

export async function loadTasks(): Promise<Task[]> {
  try {
    const savedTasks = await AsyncStorage.getItem(TASKS_KEY);

    if (savedTasks === null) {
      return [];
    }

    return JSON.parse(savedTasks) as Task[];
  } catch (error) {
    console.error('予定の読み込みに失敗しました:', error);
    return [];
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      TASKS_KEY,
      JSON.stringify(tasks)
    );
  } catch (error) {
    console.error('予定の保存に失敗しました:', error);
  }
}