import { useRef, useState } from 'react';
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useSettings,
  type WeekStart,
} from '@/contexts/settings-context';

const ITEM_HEIGHT = 50;

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
  const { weekStart, setWeekStart } = useSettings();

  const [pickerVisible, setPickerVisible] =
    useState(false);

  const [temporaryWeekStart, setTemporaryWeekStart] =
    useState<WeekStart>(weekStart);

  const scrollViewRef = useRef<ScrollView>(null);

  const currentLabel =
    WEEKDAYS.find(
      (weekday) => weekday.value === weekStart
    )?.label ?? '月曜日';

  const openPicker = () => {
    setTemporaryWeekStart(weekStart);
    setPickerVisible(true);

    const index = WEEKDAYS.findIndex(
      (weekday) => weekday.value === weekStart
    );

    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: false,
      });
    }, 100);
  };

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetY =
      event.nativeEvent.contentOffset.y;

    const index = Math.round(
      offsetY / ITEM_HEIGHT
    );

    const safeIndex = Math.max(
      0,
      Math.min(index, WEEKDAYS.length - 1)
    );

    setTemporaryWeekStart(
      WEEKDAYS[safeIndex].value
    );
  };

  const handleSave = () => {
    setWeekStart(temporaryWeekStart);
    setPickerVisible(false);
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
          onPress={openPicker}
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

            <View style={styles.pickerWrapper}>
              {/* 中央の選択枠 */}
              <View
                pointerEvents="none"
                style={styles.selectionBox}
              />

              <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={
                  handleScrollEnd
                }
                onScrollEndDrag={
                  handleScrollEnd
                }
                contentContainerStyle={
                  styles.scrollContent
                }
              >
                {WEEKDAYS.map((weekday) => (
                  <View
                    key={weekday.value}
                    style={styles.pickerItem}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,

                        temporaryWeekStart ===
                          weekday.value &&
                          styles.selectedText,
                      ]}
                    >
                      {weekday.label}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.buttons}>
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

              <Pressable
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveText}>
                  完了
                </Text>
              </Pressable>
            </View>
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
    marginBottom: 16,
  },

  pickerWrapper: {
    height: ITEM_HEIGHT * 5,
    overflow: 'hidden',
  },

  scrollContent: {
    paddingVertical: ITEM_HEIGHT * 2,
  },

  pickerItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pickerItemText: {
    fontSize: 18,
    color: '#aaaaaa',
  },

  selectedText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222222',
  },

  selectionBox: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
  },

  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },

  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
  },

  cancelText: {
    fontSize: 16,
    color: '#666666',
  },

  saveButton: {
    backgroundColor: '#222222',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 9,
  },

  saveText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});