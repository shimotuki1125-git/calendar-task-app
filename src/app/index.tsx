import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TaskAddForm from '@/components/task-add-form';
import TaskEditModal from '@/components/task-edit-modal';
import TaskRow from '@/components/task-row';
import { useTasks } from '@/contexts/task-context';
import { useTheme } from '@/hooks/use-theme';
import type { Task } from '@/types/task';
import {
  isCompletedOn,
  nextOccurrenceOnOrAfter,
  occursOn,
  taskForDate,
} from '@/utils/recurrence';
import {
  sortSearchResults,
  sortTasksByDateTime,
  sortTasksByTime,
  type SearchResultEntry,
} from '@/utils/tasks';

// YYYY-MM-DD → M月D日
function formatDateLabel(date: string) {
  const match = date.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return date;
  }

  return `${Number(match[2])}月${Number(match[3])}日`;
}

export default function HomeScreen() {
  const {
    tasks,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    moveTasksToDate,
    completeTasks,
  } = useTasks();

  const theme = useTheme();

  const now = new Date();

  const today =
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0');

  const weekdays = [
    '日',
    '月',
    '火',
    '水',
    '木',
    '金',
    '土',
  ];

  const dateLabel =
    `${now.getMonth() + 1}月${now.getDate()}日` +
    `（${weekdays[now.getDay()]}）`;

  // 予定追加フォーム
  const [showForm, setShowForm] =
    useState(false);

  // 編集中の予定
  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  // 編集を開いたときに表示されていた出現日
  // （繰り返し予定の「この回だけ」操作用）
  const [
    editingOccurrenceDate,
    setEditingOccurrenceDate,
  ] = useState<string | null>(null);

  // 期限切れ欄をすべて表示しているか
  const [overdueExpanded, setOverdueExpanded] =
    useState(false);

  // 検索キーワード
  const [searchQuery, setSearchQuery] =
    useState('');

  const isSearching =
    searchQuery.trim() !== '';

  // 今日の予定（繰り返しの出現分を含む）
  const todayTasks = tasks
    .filter((task) => occursOn(task, today))
    .map((task) => taskForDate(task, today));

  // 未完了（時刻順・時刻なしは最後尾）
  const incompleteTasks = sortTasksByTime(
    todayTasks.filter(
      (task) => !task.completed
    )
  );

  // 完了（時刻順・時刻なしは最後尾）
  const completedTasks = sortTasksByTime(
    todayTasks.filter(
      (task) => task.completed
    )
  );

  // 期限切れ：今日より前の日付で未完了の
  // 通常予定を日付昇順＋時刻順に並べる
  // 繰り返し予定は対象外
  // （過去の出現はそのまま失効する現行仕様）
  const overdueTasks = sortTasksByDateTime(
    tasks.filter(
      (task) =>
        !task.recurrence &&
        !task.completed &&
        task.date < today
    )
  );

  // 期限切れが多い場合は先頭5件だけ表示し、
  // 残りは「ほかN件を表示」で展開する
  const OVERDUE_PREVIEW_COUNT = 5;

  const visibleOverdueTasks =
    overdueExpanded ||
    overdueTasks.length <= OVERDUE_PREVIEW_COUNT
      ? overdueTasks
      : overdueTasks.slice(
          0,
          OVERDUE_PREVIEW_COUNT
        );

  // 期限切れをすべて今日へ移す
  // （一括操作なので実行前に確認する）
  const handleMoveOverdueToToday = () => {
    Alert.alert(
      '今日へ移しますか？',
      `期限切れの予定${overdueTasks.length}件を、すべて今日の予定に移します。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '今日へ移す',
          onPress: () =>
            moveTasksToDate(
              overdueTasks.map((task) => task.id),
              today
            ),
        },
      ]
    );
  };

  // 期限切れをすべて完了にする
  // （一括操作なので実行前に確認する）
  const handleCompleteOverdue = () => {
    Alert.alert(
      'すべて完了にしますか？',
      `期限切れの予定${overdueTasks.length}件を、すべて完了にします。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'すべて完了',
          onPress: () =>
            completeTasks(
              overdueTasks.map((task) => task.id)
            ),
        },
      ]
    );
  };

  // 検索結果：全予定からタイトル・メモで
  // 部分一致を探す
  // 繰り返し予定は元の予定を1件として扱い、
  // 表示される日付（繰り返しは次回出現日）の
  // 昇順＋時刻順に並べる
  const searchResults: SearchResultEntry[] =
    isSearching
      ? sortSearchResults(
          tasks
            .filter((task) => {
              const query = searchQuery
                .trim()
                .toLowerCase();

              return (
                task.title
                  .toLowerCase()
                  .includes(query) ||
                (task.memo ?? '')
                  .toLowerCase()
                  .includes(query)
              );
            })
            .map((task) => ({
              task,

              // 繰り返し予定は開始日ではなく
              // 今日以降の次回出現日を表示
              // （次回出現がない場合は開始日）
              displayDate: task.recurrence
                ? (nextOccurrenceOnOrAfter(
                    task,
                    today
                  ) ?? task.date)
                : task.date,
            }))
        )
      : [];

  // 編集は元の予定に対して行う
  // あわせて、表示されていた出現日を
  // モーダルへ渡す（「この回だけ」操作用）
  const openEditor = (
    displayTask: Task,
    occurrenceDate: string
  ) => {
    const original = tasks.find(
      (task) => task.id === displayTask.id
    );

    setEditingTask(original ?? displayTask);
    setEditingOccurrenceDate(occurrenceDate);
  };

  const closeEditor = () => {
    setEditingTask(null);
    setEditingOccurrenceDate(null);
  };

  const renderRow = (task: Task) => (
    <TaskRow
      key={task.id}
      task={task}
      onToggle={() => toggleTask(task.id, today)}
      onEdit={() => openEditor(task, today)}
    />
  );

  // 期限切れの行（日付ラベル付き）
  const renderOverdueRow = (task: Task) => (
    <TaskRow
      key={`overdue-${task.id}`}
      task={task}
      dateLabel={formatDateLabel(task.date)}
      onToggle={() =>
        toggleTask(task.id, task.date)
      }
      onEdit={() => openEditor(task, task.date)}
    />
  );

  // 検索結果の行
  // （日付・時刻・タイトル・メモを表示）
  const renderSearchResult = (
    entry: SearchResultEntry
  ) => {
    const { task, displayDate } = entry;

    // 表示日の時点で完了しているか
    // （繰り返し予定は表示日＝次回出現日の完了状態）
    const completed = task.recurrence
      ? isCompletedOn(task, displayDate)
      : task.completed;

    const timeLabel = task.startTime
      ? task.endTime
        ? `${task.startTime}〜${task.endTime}`
        : task.startTime
      : '―';

    return (
      <Pressable
        key={task.id}
        style={styles.searchResult}
        onPress={() =>
          openEditor(task, displayDate)
        }
      >
        <View style={styles.searchMeta}>
          <Text
            style={[
              styles.searchDate,
              { color: theme.text },
            ]}
          >
            {formatDateLabel(displayDate)}
          </Text>

          <Text
            style={[
              styles.searchTime,
              { color: theme.textSecondary },
            ]}
          >
            {timeLabel}
          </Text>
        </View>

        <View style={styles.searchMain}>
          <Text
            style={[
              styles.searchTitle,
              { color: theme.text },
              completed && {
                color: theme.textTertiary,
                textDecorationLine: 'line-through',
              },
            ]}
          >
            {task.title}
            {task.recurrence ? '  ↻' : ''}
          </Text>

          {completed && (
            <Text
              style={[
                styles.searchDone,
                { color: theme.textTertiary },
              ]}
            >
              ✓ 完了
            </Text>
          )}

          {!!task.memo && (
            <Text
              style={[
                styles.searchMemo,
                { color: theme.textTertiary },
              ]}
              numberOfLines={1}
            >
              {task.memo}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  const lineStyle = [
    styles.line,
    { backgroundColor: theme.border },
  ];

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      {/* 日付 */}
      <Text
        style={[
          styles.date,
          { color: theme.text },
        ]}
      >
        {dateLabel}
      </Text>

      {/* 検索欄 */}
      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
        placeholder="予定を検索"
        placeholderTextColor={theme.textTertiary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
      />

      {isSearching ? (
        <>
          {/* 検索結果 */}
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text },
            ]}
          >
            検索結果（{searchResults.length}件）
          </Text>

          <View style={lineStyle} />

          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={
              styles.listContent
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {searchResults.length === 0 && (
              <Text
                style={[
                  styles.emptyText,
                  { color: theme.textTertiary },
                ]}
              >
                「{searchQuery.trim()}」に
                一致する予定はありません
              </Text>
            )}

            {searchResults.map(
              renderSearchResult
            )}
          </ScrollView>
        </>
      ) : (
        <>
          {/* 今日の予定リスト
              （予定が多くても下まで届くよう
              スクロール可能にする） */}
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={
              styles.listContent
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 期限切れ（ある場合のみ表示） */}
            {overdueTasks.length > 0 && (
              <>
                <View style={styles.overdueHeader}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.error },
                    ]}
                  >
                    期限切れ
                  </Text>

                  <View
                    style={styles.overdueActions}
                  >
                    <Pressable
                      style={styles.overdueButton}
                      onPress={
                        handleMoveOverdueToToday
                      }
                    >
                      <Text
                        style={[
                          styles.overdueButtonText,
                          { color: theme.text },
                        ]}
                      >
                        今日へ移す
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.overdueButton}
                      onPress={() =>
                        handleCompleteOverdue()
                      }
                    >
                      <Text
                        style={[
                          styles.overdueButtonText,
                          { color: theme.text },
                        ]}
                      >
                        すべて完了
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={lineStyle} />

                {visibleOverdueTasks.map(
                  renderOverdueRow
                )}

                {/* 6件以上ある場合は
                    展開・折りたたみできる */}
                {overdueTasks.length >
                  OVERDUE_PREVIEW_COUNT && (
                  <Pressable
                    style={styles.overdueToggle}
                    onPress={() =>
                      setOverdueExpanded(
                        (current) => !current
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.overdueToggleText,
                        {
                          color:
                            theme.textSecondary,
                        },
                      ]}
                    >
                      {overdueExpanded
                        ? '折りたたむ'
                        : `ほか${overdueTasks.length - OVERDUE_PREVIEW_COUNT}件を表示`}
                    </Text>
                  </Pressable>
                )}
              </>
            )}

            <Text
              style={[
                styles.sectionTitle,
                overdueTasks.length > 0 &&
                  styles.sectionTitleSpaced,
                { color: theme.text },
              ]}
            >
              今日の予定
            </Text>

            <View style={lineStyle} />

            {todayTasks.length === 0 &&
              !showForm && (
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.textTertiary },
                  ]}
                >
                  今日の予定はありません
                </Text>
              )}

            {incompleteTasks.map(renderRow)}

            {/* 完了（1件以上ある場合のみ
                見出しごと表示する） */}
            {completedTasks.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    styles.completedSection,
                    { color: theme.text },
                  ]}
                >
                  完了
                </Text>

                <View style={lineStyle} />

                {completedTasks.map(renderRow)}
              </>
            )}
          </ScrollView>
        </>
      )}

      {/* 予定追加フォーム */}
      {showForm && (
        <View style={styles.formContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TaskAddForm
            date={today}
            onAdd={(title, time, options) => {
              addTask(
                title,
                today,
                time,
                options
              );

              setShowForm(false);
            }}
            onCancel={() =>
              setShowForm(false)
            }
            />
          </ScrollView>
        </View>
      )}

      {/* ＋ボタン */}
      {!showForm && (
        <Pressable
          style={[
            styles.floatingButton,
            { backgroundColor: theme.accent },
          ]}
          onPress={() =>
            setShowForm(true)
          }
        >
          <Text
            style={[
              styles.plus,
              { color: theme.accentText },
            ]}
          >
            ＋
          </Text>
        </Pressable>
      )}

      {/* 編集画面 */}
      <TaskEditModal
        task={editingTask}
        occurrenceDate={editingOccurrenceDate}
        onClose={closeEditor}
        onSave={updateTask}
        onDelete={deleteTask}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  date: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
  },

  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 24,
    fontSize: 16,
  },

  listScroll: {
    flex: 1,
  },

  listContent: {
    // ＋ボタンに最後の予定が隠れないように
    paddingBottom: 100,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },

  line: {
    height: 1,
    marginTop: 8,
    marginBottom: 8,
  },

  emptyText: {
    marginTop: 10,
    marginBottom: 4,
  },

  completedSection: {
    marginTop: 28,
  },

  // 期限切れ欄の見出し行と一括操作
  overdueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  overdueActions: {
    flexDirection: 'row',
    gap: 6,
  },

  overdueButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  overdueButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },

  overdueToggle: {
    paddingVertical: 10,
    alignItems: 'center',
  },

  overdueToggleText: {
    fontSize: 14,
  },

  // 期限切れ欄がある場合の
  // 「今日の予定」との間隔
  sectionTitleSpaced: {
    marginTop: 28,
  },

  // 検索結果の行
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingVertical: 6,
  },

  searchMeta: {
    width: 104,
  },

  searchDate: {
    fontSize: 14,
    fontWeight: '600',
  },

  searchTime: {
    fontSize: 12,
    marginTop: 2,
  },

  searchMain: {
    flex: 1,
  },

  searchTitle: {
    fontSize: 16,
  },

  searchDone: {
    fontSize: 12,
    marginTop: 2,
  },

  searchMemo: {
    fontSize: 13,
    marginTop: 2,
  },

  // 予定追加フォームの位置
  // 上端も固定して高さを制限し、
  // フォームが画面より高い場合は
  // 内側でスクロールできるようにする
  formContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 40,
    bottom: 30,
  },

  // ＋ボタン
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 30,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },

  plus: {
    fontSize: 32,
    lineHeight: 36,
  },
});
