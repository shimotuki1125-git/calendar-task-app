import {
  Tabs,
  TabList,
  TabSlot,
  TabTrigger,
} from 'expo-router/ui';

import type {
  TabListProps,
  TabTriggerSlotProps,
} from 'expo-router/ui';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function AppTabs() {
  return (
    <Tabs>
      {/* 現在の画面 */}
      <TabSlot style={styles.tabSlot} />

      {/* Web版のタブ */}
      <TabList asChild>
        <CustomTabList>
          <TabTrigger
            name="home"
            href="/"
            asChild
          >
            <TabButton>
              今日
            </TabButton>
          </TabTrigger>

          <TabTrigger
            name="calendar"
            href="/calendar"
            asChild
          >
            <TabButton>
              カレンダー
            </TabButton>
          </TabTrigger>

          <TabTrigger
            name="settings"
            href="/settings"
            asChild
          >
            <TabButton>
              設定
            </TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && styles.tabButtonFocused,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.tabText,
          isFocused && styles.tabTextFocused,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

function CustomTabList(
  props: TabListProps
) {
  return (
    <View
      {...props}
      style={styles.tabListContainer}
    >
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  tabSlot: {
    height: '100%',
  },

  tabListContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,

    minHeight: 64,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#ffffff',

    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },

  tabButton: {
    minWidth: 110,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },

  tabButtonFocused: {
    backgroundColor: '#f2f2f2',
  },

  tabText: {
    fontSize: 14,
    color: '#888888',
  },

  tabTextFocused: {
    color: '#222222',
    fontWeight: '600',
  },

  pressed: {
    opacity: 0.6,
  },
});
