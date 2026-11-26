import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TaskAddForm from '@/components/task-add-form';
import TaskEditModal from '@/components/task-edit-modal';
import TaskRow from '@/components/task-row';
import { useSettings } from '@/contexts/settings-context';
import { useTasks } from '@/contexts/task-context';
import { useTheme } from '@/hooks/use-theme';
import type { Task } from '@/types/task';
import {
  isCompletedOn,
  occursOn,
  taskForDate,
} from '@/utils/recurrence';
import { sortTasksByTime } from '@/utils/tasks';

const WEEKDAY_DATA = [
  { label: '日', value: 'sunday', number: 0 },
  { label: '月', value: 'monday', number: 1 },
  { label: '火', value: 'tuesday', number: 2 },
  { label: '水', value: 'wednesday', number: 3 },
  { label: '木', value: 'thursday', number: 4 },
  { label: '金', value: 'friday', number: 5 },
  { label: '土', value: 'saturday', number: 6 },
] as const;

function formatDate(
  year: number,
  month: number,
  day: number
) {
  return (
    `${year}-` +
    `${String(month + 1).padStart(2, '0')}-` +
    `${String(day).padStart(2, '0')}`
  );
}

export default function CalendarScreen() {
  const {
    tasks,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
  } = useTasks();

  const { weekStart } = useSettings();

  const theme = useTheme();

  const today = new Date();

  const [year, setYear] = useState(
    today.getFullYear()
  );

  const [month, setMonth] = useState(
    today.getMonth()
  );

  const [selectedDay, setSelectedDay] =
    useState(today.getDate());

  const [showForm, setShowForm] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  // 編集を開いたときに表示されていた出現日
  // （繰り返し予定の「この回だけ」操作用）
  const [
    editingOccurrenceDate,
    setEditingOccurrenceDate,
  ] = useState<string | null>(null);

  // -----------------------------
  // 開始曜日
  // -----------------------------

  const startWeekdayIndex =
    WEEKDAY_DATA.findIndex(
      (weekday) => weekday.value === weekStart
    );

  const startWeekdayNumber =
    WEEKDAY_DATA[startWeekdayIndex].number;

  const orderedWeekdays = [
    ...WEEKDAY_DATA.slice(startWeekdayIndex),
    ...WEEKDAY_DATA.slice(
      0,
      startWeekdayIndex
    ),
  ];

  // -----------------------------
  // カレンダー生成
  // -----------------------------

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    year,
    month,
    1
  ).getDay();

  const firstDay =
    (
      firstDayOfMonth -
      startWeekdayNumber +
      7
    ) % 7;

  const cells: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  // -----------------------------
  // 選択中の日付
  // -----------------------------

  const selectedDate = formatDate(
    year,
    month,
    selectedDay
  );

  // 選択中の日付の予定
  // （繰り返しの出現分を含む）
  const selectedTasks = tasks
    .filter((task) =>
      occursOn(task, selectedDate)
    )
    .map((task) =>
      taskForDate(task, selectedDate)
    );

  // 完了・未完了の各グループ内で
  // 時刻順に並べる（時刻なしは最後尾）
  const incompleteTasks = sortTasksByTime(
    selectedTasks.filter(
      (task) => !task.completed
    )
  );

  const completedTasks = sortTasksByTime(
    selectedTasks.filter(
      (task) => task.completed
    )
  );

  // -----------------------------
  // 前月
  // -----------------------------

  const goPreviousMonth = () => {
    if (month === 0) {
      setYear(
        (currentYear) => currentYear - 1
      );

      setMonth(11);
    } else {
      setMonth(
        (currentMonth) =>
          currentMonth - 1
      );
    }

    setSelectedDay(1);
    setShowForm(false);
  };

  // -----------------------------
  // 翌月
  // -----------------------------

  const goNextMonth = () => {
    if (month === 11) {
      setYear(
        (currentYear) => currentYear + 1
      );

      setMonth(0);
    } else {
      setMonth(
        (currentMonth) =>
          currentMonth + 1
      );
    }

    setSelectedDay(1);
    setShowForm(false);
  };

  // -----------------------------
  // 今日へ戻る
  // -----------------------------

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(today.getDate());
    setShowForm(false);
  };

  // -----------------------------
  // 今日かどうか
  // -----------------------------

  const isToday = (day: number) => {
    return (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    );
  };

  // -----------------------------
  // その日のドットの状態
  // 'none'：予定なし
  // 'incomplete'：未完了の予定が残っている
  // 'allCompleted'：出現する予定が
  //   すべて完了している
  // -----------------------------

  const getDotState = (
    day: number
  ): 'none' | 'incomplete' | 'allCompleted' => {
    const date = formatDate(
      year,
      month,
      day
    );

    const dayTasks = tasks.filter((task) =>
      occursOn(task, date)
    );

    if (dayTasks.length === 0) {
      return 'none';
    }

    return dayTasks.every((task) =>
      isCompletedOn(task, date)
    )
      ? 'allCompleted'
      : 'incomplete';
  };

  // -----------------------------
  // 編集画面を開く
  // （表示用ではなく元の予定を渡す）
  // あわせて選択中の日付を出現日として
  // モーダルへ渡す（「この回だけ」操作用）
  // -----------------------------

  const openEditor = (displayTask: Task) => {
    const original = tasks.find(
      (task) => task.id === displayTask.id
    );

    setEditingTask(original ?? displayTask);
    setEditingOccurrenceDate(selectedDate);
  };

  const closeEditor = () => {
    setEditingTask(null);
    setEditingOccurrenceDate(null);
  };

  // -----------------------------
  // 日付選択
  // -----------------------------

  const handleSelectDay = (
    day: number
  ) => {
    setSelectedDay(day);
    setShowForm(false);
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      {/* 年月 */}
      <View style={styles.header}>
        <Pressable
          style={styles.arrowButton}
          onPress={goPreviousMonth}
        >
          <Text
            style={[
              styles.arrow,
              { color: theme.text },
            ]}
          >
            ‹
          </Text>
        </Pressable>

        <Text
          style={[
            styles.monthTitle,
            { color: theme.text },
          ]}
        >
          {year}年{month + 1}月
        </Text>

        <View style={styles.headerRight}>
          <Pressable
            style={[
              styles.todayButton,
              { borderColor: theme.border },
            ]}
            onPress={goToday}
          >
            <Text
              style={[
                styles.todayButtonText,
                { color: theme.text },
              ]}
            >
              今日
            </Text>
          </Pressable>

          <Pressable
            style={styles.arrowButton}
            onPress={goNextMonth}
          >
            <Text
              style={[
                styles.arrow,
                { color: theme.text },
              ]}
            >
              ›
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 曜日 */}
      <View style={styles.weekRow}>
        {orderedWeekdays.map(
          (weekday) => (
            <Text
              key={weekday.value}
              style={[
                styles.weekday,
                { color: theme.textSecondary },
              ]}
            >
              {weekday.label}
            </Text>
          )
        )}
      </View>

      {/* カレンダー */}
      <View style={styles.calendar}>
        {cells.map((day, index) => {
          const selected =
            day === selectedDay;

          const dotState =
            day !== null
              ? getDotState(day)
              : 'none';

          return (
            <View
              key={index}
              style={styles.dayCell}
            >
              {day !== null && (
                <Pressable
                  style={[
                    styles.dayButton,

                    selected && {
                      backgroundColor: theme.accent,
                    },

                    isToday(day) &&
                      !selected && [
                        styles.today,
                        {
                          borderColor: theme.accent,
                        },
                      ],
                  ]}
                  onPress={() =>
                    handleSelectDay(day)
                  }
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: theme.text },

                      selected && [
                        styles.selectedDayText,
                        { color: theme.accentText },
                      ],
                    ]}
                  >
                    {day}
                  </Text>

                  {dotState !== 'none' && (
                    <View
                      style={[
                        styles.taskDot,
                        {
                          // すべて完了した日は
                          // 薄い色にして、
                          // 未完了が残る日と
                          // 見分けられるようにする
                          backgroundColor:
                            dotState ===
                            'allCompleted'
                              ? theme.textTertiary
                              : theme.textSecondary,
                        },

                        selected && {
                          backgroundColor:
                            theme.accentText,
                        },
                      ]}
                    />
                  )}
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      <View
        style={[
          styles.divider,
          { backgroundColor: theme.border },
        ]}
      />

      {/* 日付見出し・フォーム・予定リストは
          スクロール可能にする（フォームが
          画面に収まらない端末でも下まで届くように） */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      {/* 選択中の日付 */}
      <View style={styles.selectedHeader}>
        <Text
          style={[
            styles.selectedDateTitle,
            { color: theme.text },
          ]}
        >
          {month + 1}月{selectedDay}日
        </Text>

        <Pressable
          style={styles.smallAddButton}
          onPress={() =>
            setShowForm(
              (current) => !current
            )
          }
        >
          <Text
            style={[
              styles.smallAddText,
              { color: theme.text },
            ]}
          >
            ＋
          </Text>
        </Pressable>
      </View>

      {/* 予定追加フォーム */}
      {showForm && (
        <View style={styles.formContainer}>
          <TaskAddForm
            showTitle={false}
            date={selectedDate}
            onAdd={(title, time, options) => {
              addTask(
                title,
                selectedDate,
                time,
                options
              );

              setShowForm(false);
            }}
            onCancel={() =>
              setShowForm(false)
            }
          />
        </View>
      )}

      {/* 予定なし */}
      {selectedTasks.length === 0 &&
        !showForm && (
          <Text
            style={[
              styles.emptyText,
              { color: theme.textTertiary },
            ]}
          >
            予定はありません
          </Text>
        )}

      {/* 未完了 */}
      {incompleteTasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onToggle={() =>
            toggleTask(task.id, selectedDate)
          }
          onEdit={() => openEditor(task)}
        />
      ))}

      {/* 完了 */}
      {completedTasks.length > 0 && (
        <>
          <Text
            style={[
              styles.completedLabel,
              { color: theme.textSecondary },
            ]}
          >
            完了
          </Text>

          {completedTasks.map(
            (task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() =>
                  toggleTask(
                    task.id,
                    selectedDate
                  )
                }
                onEdit={() =>
                  openEditor(task)
                }
              />
            )
          )}
        </>
      )}
      </ScrollView>

      {/* 編集モーダル */}
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  monthTitle: {
    fontSize: 22,
    fontWeight: '700',
  },

  arrowButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrow: {
    fontSize: 32,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  todayButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },

  todayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },

  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 14,
  },

  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayCell: {
    width: `${100 / 7}%`,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayText: {
    fontSize: 16,
  },

  today: {
    borderWidth: 1,
  },

  selectedDayText: {
    fontWeight: '600',
  },

  taskDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  divider: {
    height: 1,
    marginTop: 18,
    marginBottom: 18,
  },

  scrollArea: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 24,
  },

  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectedDateTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  smallAddButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallAddText: {
    fontSize: 28,
  },

  formContainer: {
    marginTop: 12,
    marginBottom: 12,
  },

  emptyText: {
    marginTop: 18,
  },

  completedLabel: {
    marginTop: 14,
    marginBottom: 4,
    fontSize: 14,
  },
});