import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const ITEM_HEIGHT = 50;

const HOURS = Array.from(
  { length: 24 },
  (_, index) => index
);

const MINUTES = Array.from(
  { length: 60 },
  (_, index) => index
);

type TimePickerModalProps = {
  visible: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (time: string) => void;
};

export default function TimePickerModal({
  visible,
  value,
  onClose,
  onConfirm,
}: TimePickerModalProps) {
  const hourRef = useRef<ScrollView>(null);
  const minuteRef = useRef<ScrollView>(null);

  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);

  // モーダルを開いたときに
  // 現在の時刻へスクロール
  useEffect(() => {
    if (!visible) {
      return;
    }

    let initialHour = 12;
    let initialMinute = 0;

    const match = value.match(
      /^(\d{1,2}):(\d{2})$/
    );

    if (match) {
      const parsedHour = Number(match[1]);
      const parsedMinute = Number(match[2]);

      if (
        parsedHour >= 0 &&
        parsedHour <= 23
      ) {
        initialHour = parsedHour;
      }

      if (
        parsedMinute >= 0 &&
        parsedMinute <= 59
      ) {
        initialMinute = parsedMinute;
      }
    } else {
      // 時刻未設定なら、次の正時（○時00分）を
      // 初期値にする（現在時刻の分まで使うと
      // 11:57 のような中途半端な時刻になるため）
      const now = new Date();

      initialHour =
        now.getMinutes() === 0
          ? now.getHours()
          : (now.getHours() + 1) % 24;

      initialMinute = 0;
    }

    setHour(initialHour);
    setMinute(initialMinute);

    setTimeout(() => {
      hourRef.current?.scrollTo({
        y: initialHour * ITEM_HEIGHT,
        animated: false,
      });

      minuteRef.current?.scrollTo({
        y: initialMinute * ITEM_HEIGHT,
        animated: false,
      });
    }, 100);
  }, [visible, value]);

  const handleHourScrollEnd = (
    offsetY: number
  ) => {
    const index = Math.round(
      offsetY / ITEM_HEIGHT
    );

    const safeIndex = Math.max(
      0,
      Math.min(index, HOURS.length - 1)
    );

    setHour(HOURS[safeIndex]);
  };

  const handleMinuteScrollEnd = (
    offsetY: number
  ) => {
    const index = Math.round(
      offsetY / ITEM_HEIGHT
    );

    const safeIndex = Math.max(
      0,
      Math.min(index, MINUTES.length - 1)
    );

    setMinute(MINUTES[safeIndex]);
  };

  const handleConfirm = () => {
    const formattedTime =
      `${String(hour).padStart(2, '0')}:` +
      `${String(minute).padStart(2, '0')}`;

    onConfirm(formattedTime);
    onClose();
  };

  const handleClear = () => {
    onConfirm('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.background}>
        <Pressable
          style={styles.outside}
          onPress={onClose}
        />

        <View style={styles.container}>
          <Text style={styles.title}>
            時刻を選択
          </Text>

          <View style={styles.pickerArea}>
            {/* 中央の選択枠 */}
            <View
              pointerEvents="none"
              style={styles.selectionBox}
            />

            {/* 時 */}
            <ScrollView
              ref={hourRef}
              style={styles.wheel}
              contentContainerStyle={
                styles.scrollContent
              }
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(event) =>
                handleHourScrollEnd(
                  event.nativeEvent.contentOffset.y
                )
              }
              onScrollEndDrag={(event) =>
                handleHourScrollEnd(
                  event.nativeEvent.contentOffset.y
                )
              }
            >
              {HOURS.map((item) => (
                <View
                  key={item}
                  style={styles.item}
                >
                  <Text
                    style={[
                      styles.itemText,
                      hour === item &&
                        styles.selectedText,
                    ]}
                  >
                    {String(item).padStart(
                      2,
                      '0'
                    )}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <Text style={styles.separator}>
              :
            </Text>

            {/* 分 */}
            <ScrollView
              ref={minuteRef}
              style={styles.wheel}
              contentContainerStyle={
                styles.scrollContent
              }
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(event) =>
                handleMinuteScrollEnd(
                  event.nativeEvent.contentOffset.y
                )
              }
              onScrollEndDrag={(event) =>
                handleMinuteScrollEnd(
                  event.nativeEvent.contentOffset.y
                )
              }
            >
              {MINUTES.map((item) => (
                <View
                  key={item}
                  style={styles.item}
                >
                  <Text
                    style={[
                      styles.itemText,
                      minute === item &&
                        styles.selectedText,
                    ]}
                  >
                    {String(item).padStart(
                      2,
                      '0'
                    )}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.buttons}>
            <Pressable
              style={styles.clearButton}
              onPress={handleClear}
            >
              <Text style={styles.clearText}>
                時刻なし
              </Text>
            </Pressable>

            <View style={styles.rightButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelText}>
                  キャンセル
                </Text>
              </Pressable>

              <Pressable
                style={styles.confirmButton}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmText}>
                  完了
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },

  outside: {
    flex: 1,
  },

  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
  },

  pickerArea: {
    height: ITEM_HEIGHT * 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  selectionBox: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 30,
    right: 30,
    height: ITEM_HEIGHT,
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
  },

  wheel: {
    width: 90,
    height: ITEM_HEIGHT * 5,
  },

  scrollContent: {
    paddingVertical: ITEM_HEIGHT * 2,
  },

  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemText: {
    fontSize: 18,
    color: '#aaaaaa',
  },

  selectedText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#222222',
  },

  separator: {
    width: 30,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    zIndex: 1,
  },

  buttons: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  clearText: {
    fontSize: 15,
    color: '#666666',
  },

  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  cancelText: {
    fontSize: 16,
    color: '#666666',
  },

  confirmButton: {
    backgroundColor: '#222222',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 9,
  },

  confirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});