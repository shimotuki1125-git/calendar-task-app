import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useSettings,
  type WeekStart,
} from '@/contexts/settings-context';
import { ensureNotificationPermission } from '@/notifications/task-notifications';

const WEEKDAYS: {
  value: WeekStart;
  label: string;
}[] = [
  { value: 'monday', label: '月曜日' },
  { value: 'tuesday', label: '火曜日' },
  { value: 'wednesday', label: '水曜日' },
  { value: 'thursday', label: '木曜日' },
  { value: 'friday', label: '金曜日' },
  { value: 'saturday', label: '土曜日' },
  { value: 'sunday', label: '日曜日' },
];

export default function SettingsScreen() {
  const {
    weekStart,
    setWeekStart,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useSettings();

  const [pickerVisible, setPickerVisible] =
    useState(false);

  const currentLabel =
    WEEKDAYS.find(
      (weekday) => weekday.value === weekStart
    )?.label ?? '月曜日';

  // リストから選んだら即反映して閉じる
  const handleSelectWeekStart = (
    value: WeekStart
  ) => {
    setWeekStart(value);
    setPickerVisible(false);
  };

  const handleToggleNotifications = (
    enabled: boolean
  ) => {
    setNotificationsEnabled(enabled);

    // オンにしたときは通知許可を確認する
    if (enabled) {
      ensureNotificationPermission();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>設定</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          カレンダー
        </Text>

        <Pressable
          style={styles.settingRow}
          onPress={() =>
            setPickerVisible(true)
          }
        >
          <Text style={styles.settingName}>
            週の開始
          </Text>

          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>
              {currentLabel}
            </Text>

            <Text style={styles.chevron}>›</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          通知
        </Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingName}>
            予定のリマインダー
          </Text>

          <Switch
            value={notificationsEnabled}
            onValueChange={
              handleToggleNotifications
            }
          />
        </View>

        <Text style={styles.description}>
          予定の開始時刻に通知します。
          繰り返しの予定は直近の出現分が対象です。
        </Text>
      </View>

      {/* 曜日選択 */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setPickerVisible(false)
        }
      >
        <View style={styles.modalBackground}>
          <Pressable
            style={styles.modalOutside}
            onPress={() =>
              setPickerVisible(false)
            }
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>
              週の開始
            </Text>

            {WEEKDAYS.map((weekday) => {
              const selected =
                weekday.value === weekStart;

              return (
                <Pressable
                  key={weekday.value}
                  style={styles.listItem}
                  onPress={() =>
                    handleSelectWeekStart(
                      weekday.value
                    )
                  }
                >
                  <Text
                    style={[
                      styles.listItemText,
                      selected &&
                        styles.listItemSelected,
                    ]}
                  >
                    {weekday.label}
                  </Text>

                  {selected && (
                    <Text style={styles.checkText}>
                      ✓
                    </Text>
                  )}
                </Pressable>
              );
            })}

            <Pressable
              style={styles.cancelButton}
              onPress={() =>
                setPickerVisible(false)
              }
            >
              <Text style={styles.cancelText}>
                キャンセル
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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

  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 36,
  },

  section: {
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 14,
    color: '#777777',
    marginBottom: 8,
  },

  settingRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  settingName: {
    fontSize: 17,
  },

  description: {
    fontSize: 13,
    color: '#999999',
    marginTop: 10,
    lineHeight: 19,
  },

  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  settingValue: {
    fontSize: 16,
    color: '#777777',
  },

  chevron: {
    fontSize: 26,
    color: '#aaaaaa',
    marginLeft: 8,
  },

  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },

  modalOutside: {
    flex: 1,
  },

  pickerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },

  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },

  listItem: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 4,
  },

  listItemText: {
    fontSize: 17,
    color: '#444444',
  },

  listItemSelected: {
    fontWeight: '600',
    color: '#222222',
  },

  checkText: {
    fontSize: 17,
    color: '#222222',
  },

  cancelButton: {
    marginTop: 14,
    paddingVertical: 11,
    alignItems: 'center',
  },

  cancelText: {
    fontSize: 16,
    color: '#666666',
  },
});