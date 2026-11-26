import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const ITEM_HEIGHT = 50;

type DatePickerModalProps = {
  visible: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (date: string) => void;
};

function formatDate(
  year: number,
  month: number,
  day: number
) {
  return (
    `${year}-` +
    `${String(month).padStart(2, '0')}-` +
    `${String(day).padStart(2, '0')}`
  );
}

export default function DatePickerModal({
  visible,
  value,
  onClose,
  onConfirm,
}: DatePickerModalProps) {
  const theme = useTheme();

  const currentYear = new Date().getFullYear();

  const years = useMemo(
    () =>
      Array.from(
        { length: 21 },
        (_, index) => currentYear - 5 + index
      ),
    [currentYear]
  );

  const months = useMemo(
    () =>
      Array.from(
        { length: 12 },
        (_, index) => index + 1
      ),
    []
  );

  const yearRef = useRef<ScrollView>(null);
  const monthRef = useRef<ScrollView>(null);
  const dayRef = useRef<ScrollView>(null);

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(
    new Date().getMonth() + 1
  );
  const [day, setDay] = useState(
    new Date().getDate()
  );

  const daysInMonth = new Date(
    year,
    month,
    0
  ).getDate();

  const days = useMemo(
    () =>
      Array.from(
        { length: daysInMonth },
        (_, index) => index + 1
      ),
    [daysInMonth]
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    let initialYear = currentYear;
    let initialMonth = new Date().getMonth() + 1;
    let initialDay = new Date().getDate();

    const match = value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (match) {
      initialYear = Number(match[1]);
      initialMonth = Number(match[2]);
      initialDay = Number(match[3]);
    }

    setYear(initialYear);
    setMonth(initialMonth);
    setDay(initialDay);

    const yearIndex = Math.max(
      0,
      years.indexOf(initialYear)
    );

    setTimeout(() => {
      yearRef.current?.scrollTo({
        y: yearIndex * ITEM_HEIGHT,
        animated: false,
      });

      monthRef.current?.scrollTo({
        y: (initialMonth - 1) * ITEM_HEIGHT,
        animated: false,
      });

      dayRef.current?.scrollTo({
        y: (initialDay - 1) * ITEM_HEIGHT,
        animated: false,
      });
    }, 100);
  }, [visible, value, currentYear, years]);

  // 月や年を変えた結果、
  // 31日などが存在しなくなった場合に補正
  useEffect(() => {
    if (day > daysInMonth) {
      setDay(daysInMonth);

      setTimeout(() => {
        dayRef.current?.scrollTo({
          y: (daysInMonth - 1) * ITEM_HEIGHT,
          animated: true,
        });
      }, 0);
    }
  }, [day, daysInMonth]);

  const handleYearScroll = (
    offsetY: number
  ) => {
    const index = Math.round(
      offsetY / ITEM_HEIGHT
    );

    const safeIndex = Math.max(
      0,
      Math.min(index, years.length - 1)
    );

    setYear(years[safeIndex]);
  };

  const handleMonthScroll = (
    offsetY: number
  ) => {
    const index = Math.round(
      offsetY / ITEM_HEIGHT
    );

    const safeIndex = Math.max(
      0,
      Math.min(index, months.length - 1)
    );

    setMonth(months[safeIndex]);
  };

  const handleDayScroll = (
    offsetY: number
  ) => {
    const index = Math.round(
      offsetY / ITEM_HEIGHT
    );

    const safeIndex = Math.max(
      0,
      Math.min(index, days.length - 1)
    );

    setDay(days[safeIndex]);
  };

  const handleConfirm = () => {
    onConfirm(
      formatDate(
        year,
        month,
        day
      )
    );

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

        <View
          style={[
            styles.container,
            { backgroundColor: theme.background },
          ]}
        >
          <Text
            style={[
              styles.title,
              { color: theme.text },
            ]}
          >
            日付を選択
          </Text>

          <View style={styles.pickerArea}>
            <View
              pointerEvents="none"
              style={[
                styles.selectionBox,
                {
                  backgroundColor: theme.selection,
                },
              ]}
            />

            {/* 年 */}
            <ScrollView
              ref={yearRef}
              style={styles.yearWheel}
              contentContainerStyle={
                styles.scrollContent
              }
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(event) =>
                handleYearScroll(
                  event.nativeEvent.contentOffset.y
                )
              }
              onScrollEndDrag={(event) =>
                handleYearScroll(
                  event.nativeEvent.contentOffset.y
                )
              }
            >
              {years.map((item) => (
                <View
                  key={item}
                  style={styles.item}
                >
                  <Text
                    style={[
                      styles.itemText,
                      { color: theme.textTertiary },
                      year === item && [
                        styles.selectedText,
                        { color: theme.text },
                      ],
                    ]}
                  >
                    {item}年
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* 月 */}
            <ScrollView
              ref={monthRef}
              style={styles.smallWheel}
              contentContainerStyle={
                styles.scrollContent
              }
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(event) =>
                handleMonthScroll(
                  event.nativeEvent.contentOffset.y
                )
              }
              onScrollEndDrag={(event) =>
                handleMonthScroll(
                  event.nativeEvent.contentOffset.y
                )
              }
            >
              {months.map((item) => (
                <View
                  key={item}
                  style={styles.item}
                >
                  <Text
                    style={[
                      styles.itemText,
                      { color: theme.textTertiary },
                      month === item && [
                        styles.selectedText,
                        { color: theme.text },
                      ],
                    ]}
                  >
                    {item}月
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* 日 */}
            <ScrollView
              ref={dayRef}
              style={styles.smallWheel}
              contentContainerStyle={
                styles.scrollContent
              }
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(event) =>
                handleDayScroll(
                  event.nativeEvent.contentOffset.y
                )
              }
              onScrollEndDrag={(event) =>
                handleDayScroll(
                  event.nativeEvent.contentOffset.y
                )
              }
            >
              {days.map((item) => (
                <View
                  key={item}
                  style={styles.item}
                >
                  <Text
                    style={[
                      styles.itemText,
                      { color: theme.textTertiary },
                      day === item && [
                        styles.selectedText,
                        { color: theme.text },
                      ],
                    ]}
                  >
                    {item}日
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.buttons}>
            <Pressable
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text
                style={[
                  styles.cancelText,
                  { color: theme.textSecondary },
                ]}
              >
                キャンセル
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.confirmButton,
                { backgroundColor: theme.accent },
              ]}
              onPress={handleConfirm}
            >
              <Text
                style={[
                  styles.confirmText,
                  { color: theme.accentText },
                ]}
              >
                完了
              </Text>
            </Pressable>
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
    left: 10,
    right: 10,
    height: ITEM_HEIGHT,
    borderRadius: 10,
  },

  yearWheel: {
    width: 120,
    height: ITEM_HEIGHT * 5,
  },

  smallWheel: {
    width: 85,
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
    fontSize: 17,
  },

  selectedText: {
    fontSize: 20,
    fontWeight: '600',
  },

  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 20,
  },

  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  cancelText: {
    fontSize: 16,
  },

  confirmButton: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 9,
  },

  confirmText: {
    fontSize: 16,
    fontWeight: '600',
  },
});