import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { ReactNode } from 'react';

export type WeekStart =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

type SettingsContextType = {
  weekStart: WeekStart;
  setWeekStart: (weekStart: WeekStart) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (
    enabled: boolean
  ) => void;
  isLoaded: boolean;
};

const SettingsContext =
  createContext<SettingsContextType | undefined>(
    undefined
  );

const WEEK_START_KEY = 'weekStart';

const NOTIFICATIONS_ENABLED_KEY =
  'notificationsEnabled';

export function SettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [weekStart, setWeekStartState] =
    useState<WeekStart>('monday');

  const [
    notificationsEnabled,
    setNotificationsEnabledState,
  ] = useState(true);

  const [isLoaded, setIsLoaded] = useState(false);

  // 保存されている設定を読み込む
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedWeekStart =
          await AsyncStorage.getItem(WEEK_START_KEY);

        if (
          savedWeekStart === 'monday' ||
          savedWeekStart === 'tuesday' ||
          savedWeekStart === 'wednesday' ||
          savedWeekStart === 'thursday' ||
          savedWeekStart === 'friday' ||
          savedWeekStart === 'saturday' ||
          savedWeekStart === 'sunday'
        ) {
          setWeekStartState(savedWeekStart);
        }

        const savedNotificationsEnabled =
          await AsyncStorage.getItem(
            NOTIFICATIONS_ENABLED_KEY
          );

        if (savedNotificationsEnabled !== null) {
          setNotificationsEnabledState(
            savedNotificationsEnabled === 'true'
          );
        }
      } catch (error) {
        console.error(
          '設定の読み込みに失敗しました:',
          error
        );
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // 開始曜日を変更して保存する
  const setWeekStart = (
    newWeekStart: WeekStart
  ) => {
    setWeekStartState(newWeekStart);

    AsyncStorage.setItem(
      WEEK_START_KEY,
      newWeekStart
    ).catch((error) => {
      console.error(
        '設定の保存に失敗しました:',
        error
      );
    });
  };

  // 通知のオン / オフを変更して保存する
  const setNotificationsEnabled = (
    enabled: boolean
  ) => {
    setNotificationsEnabledState(enabled);

    AsyncStorage.setItem(
      NOTIFICATIONS_ENABLED_KEY,
      enabled ? 'true' : 'false'
    ).catch((error) => {
      console.error(
        '設定の保存に失敗しました:',
        error
      );
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        weekStart,
        setWeekStart,
        notificationsEnabled,
        setNotificationsEnabled,
        isLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (context === undefined) {
    throw new Error(
      'useSettings must be used inside SettingsProvider'
    );
  }

  return context;
}