import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useSettings,
  type WeekStart,
} from '@/contexts/settings-context';
import { useTasks } from '@/contexts/task-context';
import { useTheme } from '@/hooks/use-theme';
import { ensureNotificationPermission } from '@/notifications/task-notifications';
import type { Task } from '@/types/task';

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

// 通知タイミングの選択肢
// （値は開始時刻の何分前か。0 = 開始時刻）
const REMINDER_TIMINGS: {
  value: number;
  label: string;
}[] = [
  { value: 0, label: '開始時刻' },
  { value: 5, label: '5分前' },
  { value: 10, label: '10分前' },
  { value: 30, label: '30分前' },
  { value: 60, label: '1時間前' },
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// -----------------------------------
// バックアップの読み込み検証
// JSON を検証して Task[] に変換する
// 形式が正しくない場合は null を返す
// （呼び出し側で置き換えを中止する）
// -----------------------------------
function parseImportedTasks(
  text: string
): Task[] | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed)) {
    return null;
  }

  const imported: Task[] = [];

  for (const item of parsed) {
    if (
      typeof item !== 'object' ||
      item === null
    ) {
      return null;
    }

    const record = item as Record<
      string,
      unknown
    >;

    // 必須項目：id・date・title
    if (
      typeof record.id !== 'string' ||
      record.id === ''
    ) {
      return null;
    }

    if (
      typeof record.date !== 'string' ||
      !DATE_PATTERN.test(record.date)
    ) {
      return null;
    }

    if (
      typeof record.title !== 'string' ||
      record.title === ''
    ) {
      return null;
    }

    // 任意項目は型が合うものだけ取り込む
    const startTime =
      typeof record.startTime === 'string'
        ? record.startTime
        : '';

    const endTime =
      typeof record.endTime === 'string' &&
      record.endTime !== ''
        ? record.endTime
        : undefined;

    const memo =
      typeof record.memo === 'string' &&
      record.memo !== ''
        ? record.memo
        : undefined;

    const completed =
      typeof record.completed === 'boolean'
        ? record.completed
        : false;

    let recurrence: Task['recurrence'];

    if (
      typeof record.recurrence === 'object' &&
      record.recurrence !== null
    ) {
      const rec = record.recurrence as Record<
        string,
        unknown
      >;

      if (
        rec.freq === 'daily' ||
        rec.freq === 'weekly' ||
        rec.freq === 'monthly'
      ) {
        recurrence = {
          freq: rec.freq,
          until:
            typeof rec.until === 'string' &&
            DATE_PATTERN.test(rec.until)
              ? rec.until
              : undefined,
        };
      }
    }

    const completedDates = Array.isArray(
      record.completedDates
    )
      ? record.completedDates.filter(
          (date): date is string =>
            typeof date === 'string'
        )
      : undefined;

    imported.push({
      id: record.id,
      date: record.date,
      startTime,
      title: record.title,
      completed,
      endTime,
      memo,
      recurrence,
      completedDates,
    });
  }

  return imported;
}

export default function SettingsScreen() {
  const {
    weekStart,
    setWeekStart,
    notificationsEnabled,
    setNotificationsEnabled,
    reminderMinutesBefore,
    setReminderMinutesBefore,
  } = useSettings();

  const { tasks, replaceTasks } = useTasks();

  const theme = useTheme();

  const [pickerVisible, setPickerVisible] =
    useState(false);

  const [
    timingPickerVisible,
    setTimingPickerVisible,
  ] = useState(false);

  // データの書き出し・読み込み
  const [exportVisible, setExportVisible] =
    useState(false);

  // 書き出しJSONをコピーした直後かどうか
  const [exportCopied, setExportCopied] =
    useState(false);

  const [importVisible, setImportVisible] =
    useState(false);

  const [importText, setImportText] =
    useState('');

  const [importError, setImportError] =
    useState<string | null>(null);

  const currentLabel =
    WEEKDAYS.find(
      (weekday) => weekday.value === weekStart
    )?.label ?? '月曜日';

  const currentTimingLabel =
    REMINDER_TIMINGS.find(
      (timing) =>
        timing.value === reminderMinutesBefore
    )?.label ?? '開始時刻';

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

  // リストから選んだら即反映して閉じる
  // （通知の再同期は TaskProvider 側の
  //   既存の仕組みで連動する）
  const handleSelectReminderTiming = (
    value: number
  ) => {
    setReminderMinutesBefore(value);
    setTimingPickerVisible(false);
  };

  const openExport = () => {
    setExportCopied(false);
    setExportVisible(true);
  };

  // 書き出しJSONをクリップボードへコピーする
  const handleCopyExport = async () => {
    try {
      const copied =
        await Clipboard.setStringAsync(
          exportJson
        );

      // Web では失敗時に false が返る
      if (copied === false) {
        return;
      }

      setExportCopied(true);

      setTimeout(() => {
        setExportCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        'コピーに失敗しました:',
        error
      );
    }
  };

  // 書き出し用JSON（予定のみ・設定は含まない）
  const exportJson = JSON.stringify(
    tasks,
    null,
    2
  );

  const openImport = () => {
    setImportText('');
    setImportError(null);
    setImportVisible(true);
  };

  const handleImport = () => {
    const imported = parseImportedTasks(
      importText
    );

    if (imported === null) {
      setImportError(
        '形式が正しくありません。書き出したJSONをそのまま貼り付けてください。'
      );
      return;
    }

    Alert.alert(
      'データを読み込む',
      `${imported.length}件の予定で、現在の予定をすべて置き換えます。よろしいですか？`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '置き換える',
          style: 'destructive',
          onPress: () => {
            replaceTasks(imported);
            setImportVisible(false);
          },
        },
      ]
    );
  };

  const rowBorderStyle = {
    borderBottomColor: theme.borderLight,
  };

  return (
    <SafeAreaView
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
        設定
      </Text>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textSecondary },
            ]}
          >
            カレンダー
          </Text>

          <Pressable
            style={[
              styles.settingRow,
              rowBorderStyle,
            ]}
            onPress={() =>
              setPickerVisible(true)
            }
          >
            <Text
              style={[
                styles.settingName,
                { color: theme.text },
              ]}
            >
              週の開始
            </Text>

            <View style={styles.settingRight}>
              <Text
                style={[
                  styles.settingValue,
                  { color: theme.textSecondary },
                ]}
              >
                {currentLabel}
              </Text>

              <Text
                style={[
                  styles.chevron,
                  { color: theme.textTertiary },
                ]}
              >
                ›
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textSecondary },
            ]}
          >
            通知
          </Text>

          <View
            style={[
              styles.settingRow,
              rowBorderStyle,
            ]}
          >
            <Text
              style={[
                styles.settingName,
                { color: theme.text },
              ]}
            >
              予定のリマインダー
            </Text>

            <Switch
              value={notificationsEnabled}
              onValueChange={
                handleToggleNotifications
              }
            />
          </View>

          <Pressable
            style={[
              styles.settingRow,
              rowBorderStyle,
            ]}
            onPress={() =>
              setTimingPickerVisible(true)
            }
          >
            <Text
              style={[
                styles.settingName,
                { color: theme.text },
              ]}
            >
              通知のタイミング
            </Text>

            <View style={styles.settingRight}>
              <Text
                style={[
                  styles.settingValue,
                  { color: theme.textSecondary },
                ]}
              >
                {currentTimingLabel}
              </Text>

              <Text
                style={[
                  styles.chevron,
                  { color: theme.textTertiary },
                ]}
              >
                ›
              </Text>
            </View>
          </Pressable>

          <Text
            style={[
              styles.description,
              { color: theme.textTertiary },
            ]}
          >
            予定の開始時刻をもとに、
            「通知のタイミング」で選んだ
            時刻に通知します。
            繰り返しの予定は直近の出現分が対象です。
          </Text>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textSecondary },
            ]}
          >
            データ
          </Text>

          <Pressable
            style={[
              styles.settingRow,
              rowBorderStyle,
            ]}
            onPress={openExport}
          >
            <Text
              style={[
                styles.settingName,
                { color: theme.text },
              ]}
            >
              データを書き出す
            </Text>

            <View style={styles.settingRight}>
              <Text
                style={[
                  styles.settingValue,
                  { color: theme.textSecondary },
                ]}
              >
                {tasks.length}件
              </Text>

              <Text
                style={[
                  styles.chevron,
                  { color: theme.textTertiary },
                ]}
              >
                ›
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.settingRow,
              rowBorderStyle,
            ]}
            onPress={openImport}
          >
            <Text
              style={[
                styles.settingName,
                { color: theme.text },
              ]}
            >
              データを読み込む
            </Text>

            <View style={styles.settingRight}>
              <Text
                style={[
                  styles.chevron,
                  { color: theme.textTertiary },
                ]}
              >
                ›
              </Text>
            </View>
          </Pressable>

          <Text
            style={[
              styles.description,
              { color: theme.textTertiary },
            ]}
          >
            予定データのバックアップ用です。
            書き出すのは予定のみで、設定
            （週の開始・通知）は含まれません。
            読み込むと現在の予定は
            すべて置き換わります。
          </Text>
        </View>
      </ScrollView>

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

          <View
            style={[
              styles.pickerContainer,
              { backgroundColor: theme.background },
            ]}
          >
            <Text
              style={[
                styles.pickerTitle,
                { color: theme.text },
              ]}
            >
              週の開始
            </Text>

            {WEEKDAYS.map((weekday) => {
              const selected =
                weekday.value === weekStart;

              return (
                <Pressable
                  key={weekday.value}
                  style={[
                    styles.listItem,
                    {
                      borderBottomColor:
                        theme.borderLight,
                    },
                  ]}
                  onPress={() =>
                    handleSelectWeekStart(
                      weekday.value
                    )
                  }
                >
                  <Text
                    style={[
                      styles.listItemText,
                      { color: theme.textSecondary },
                      selected && [
                        styles.listItemSelected,
                        { color: theme.text },
                      ],
                    ]}
                  >
                    {weekday.label}
                  </Text>

                  {selected && (
                    <Text
                      style={[
                        styles.checkText,
                        { color: theme.text },
                      ]}
                    >
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
              <Text
                style={[
                  styles.cancelText,
                  { color: theme.textSecondary },
                ]}
              >
                キャンセル
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 通知タイミング選択 */}
      <Modal
        visible={timingPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setTimingPickerVisible(false)
        }
      >
        <View style={styles.modalBackground}>
          <Pressable
            style={styles.modalOutside}
            onPress={() =>
              setTimingPickerVisible(false)
            }
          />

          <View
            style={[
              styles.pickerContainer,
              { backgroundColor: theme.background },
            ]}
          >
            <Text
              style={[
                styles.pickerTitle,
                { color: theme.text },
              ]}
            >
              通知のタイミング
            </Text>

            {REMINDER_TIMINGS.map((timing) => {
              const selected =
                timing.value ===
                reminderMinutesBefore;

              return (
                <Pressable
                  key={timing.value}
                  style={[
                    styles.listItem,
                    {
                      borderBottomColor:
                        theme.borderLight,
                    },
                  ]}
                  onPress={() =>
                    handleSelectReminderTiming(
                      timing.value
                    )
                  }
                >
                  <Text
                    style={[
                      styles.listItemText,
                      { color: theme.textSecondary },
                      selected && [
                        styles.listItemSelected,
                        { color: theme.text },
                      ],
                    ]}
                  >
                    {timing.label}
                  </Text>

                  {selected && (
                    <Text
                      style={[
                        styles.checkText,
                        { color: theme.text },
                      ]}
                    >
                      ✓
                    </Text>
                  )}
                </Pressable>
              );
            })}

            <Pressable
              style={styles.cancelButton}
              onPress={() =>
                setTimingPickerVisible(false)
              }
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
          </View>
        </View>
      </Modal>

      {/* データの書き出し */}
      <Modal
        visible={exportVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setExportVisible(false)
        }
      >
        <View style={styles.modalBackground}>
          <Pressable
            style={styles.modalOutside}
            onPress={() =>
              setExportVisible(false)
            }
          />

          <View
            style={[
              styles.dataContainer,
              { backgroundColor: theme.background },
            ]}
          >
            <Text
              style={[
                styles.pickerTitle,
                { color: theme.text },
              ]}
            >
              データを書き出す
            </Text>

            <Text
              style={[
                styles.description,
                { color: theme.textTertiary },
              ]}
            >
              下のJSONをすべてコピーして
              保管してください。対象は予定のみで、
              設定は含まれません。
            </Text>

            <ScrollView
              style={[
                styles.jsonBox,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                selectable
                style={[
                  styles.jsonText,
                  { color: theme.text },
                ]}
              >
                {exportJson}
              </Text>
            </ScrollView>

            <Pressable
              style={[
                styles.copyButton,
                { backgroundColor: theme.accent },
              ]}
              onPress={handleCopyExport}
            >
              <Text
                style={[
                  styles.copyButtonText,
                  { color: theme.accentText },
                ]}
              >
                {exportCopied
                  ? 'コピーしました'
                  : 'コピーする'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() =>
                setExportVisible(false)
              }
            >
              <Text
                style={[
                  styles.cancelText,
                  { color: theme.textSecondary },
                ]}
              >
                閉じる
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* データの読み込み */}
      <Modal
        visible={importVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setImportVisible(false)
        }
      >
        <View style={styles.modalBackground}>
          <Pressable
            style={styles.modalOutside}
            onPress={() =>
              setImportVisible(false)
            }
          />

          <View
            style={[
              styles.dataContainer,
              { backgroundColor: theme.background },
            ]}
          >
            <Text
              style={[
                styles.pickerTitle,
                { color: theme.text },
              ]}
            >
              データを読み込む
            </Text>

            <Text
              style={[
                styles.description,
                { color: theme.textTertiary },
              ]}
            >
              書き出したJSONを貼り付けて
              「読み込む」を押してください。
              現在の予定はすべて置き換わります。
            </Text>

            <TextInput
              style={[
                styles.importInput,
                {
                  backgroundColor:
                    theme.inputBackground,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={importText}
              onChangeText={(text) => {
                setImportText(text);
                setImportError(null);
              }}
              placeholder="JSONを貼り付け"
              placeholderTextColor={
                theme.textTertiary
              }
              multiline
              textAlignVertical="top"
            />

            {importError !== null && (
              <Text
                style={[
                  styles.importErrorText,
                  { color: theme.error },
                ]}
              >
                {importError}
              </Text>
            )}

            <View style={styles.dataButtons}>
              <Pressable
                style={styles.dataCancelButton}
                onPress={() =>
                  setImportVisible(false)
                }
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
                  styles.dataPrimaryButton,
                  { backgroundColor: theme.accent },
                ]}
                onPress={handleImport}
              >
                <Text
                  style={[
                    styles.dataPrimaryText,
                    { color: theme.accentText },
                  ]}
                >
                  読み込む
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
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  scroll: {
    flex: 1,
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
    marginBottom: 8,
  },

  settingRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },

  settingName: {
    fontSize: 17,
  },

  description: {
    fontSize: 13,
    marginTop: 10,
    lineHeight: 19,
  },

  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  settingValue: {
    fontSize: 16,
  },

  chevron: {
    fontSize: 26,
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
    paddingHorizontal: 4,
  },

  listItemText: {
    fontSize: 17,
  },

  listItemSelected: {
    fontWeight: '600',
  },

  checkText: {
    fontSize: 17,
  },

  cancelButton: {
    marginTop: 14,
    paddingVertical: 11,
    alignItems: 'center',
  },

  cancelText: {
    fontSize: 16,
  },

  // データの書き出し・読み込み
  dataContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '88%',
  },

  jsonBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    maxHeight: 320,
  },

  jsonText: {
    fontSize: 12,
    lineHeight: 17,
  },

  copyButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: 'center',
  },

  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  importInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 12,
    fontSize: 13,
    minHeight: 150,
  },

  importErrorText: {
    fontSize: 13,
    marginTop: 10,
    lineHeight: 19,
  },

  dataButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },

  dataCancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  dataPrimaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9,
  },

  dataPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
