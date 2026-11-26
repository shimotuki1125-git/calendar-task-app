import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { SettingsProvider } from '@/contexts/settings-context';
import { TaskProvider } from '@/contexts/task-context';

SplashScreen.preventAutoHideAsync();

// アプリを開いている間も
// リマインダー通知を表示する
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={
        colorScheme === 'dark'
          ? DarkTheme
          : DefaultTheme
      }
    >
      <SettingsProvider>
        <TaskProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
        </TaskProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}