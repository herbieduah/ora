import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SectionList,
  StyleSheet,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInUp, FadeOut } from "react-native-reanimated";
import { useTodoStore } from "@/store/useTodoStore";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { withScreenErrorBoundary } from "@/components/error-boundary";
import { TAB_BAR_HEIGHT } from "@/components/navigation/ora-tab-bar";
import { colors } from "@/theme/colors";
import { getDateKey } from "@/utils/time";
import type { Todo } from "@/types";

const GOLD = colors.accent;
const BG = colors.background;

interface TodoSection {
  title: string;
  data: Todo[];
}

function TodoScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hydrated = useTodoStore((s) => s.hydrated);
  const hydrate = useTodoStore((s) => s.hydrate);
  const todos = useTodoStore((s) => s.todos);
  const addTodo = useTodoStore((s) => s.addTodo);
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const deleteTodo = useTodoStore((s) => s.deleteTodo);
  const focusTodoId = usePomodoroStore((s) => s.focusTodoId);

  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const handleSubmit = useCallback(() => {
    if (!inputText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addTodo(inputText);
    setInputText("");
    Keyboard.dismiss();
  }, [inputText, addTodo]);

  const handleToggle = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleTodo(id);
    },
    [toggleTodo],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      deleteTodo(id);
    },
    [deleteTodo],
  );

  const handleFocus = useCallback(
    (todo: Todo) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      usePomodoroStore
        .getState()
        .startWorkForTodo(todo.id, todo.text);
      router.navigate("/(tabs)/pomodoro");
    },
    [router],
  );

  const pendingTodos = useMemo(
    () => todos.filter((t) => !t.completed),
    [todos],
  );
  const completedTodos = useMemo(
    () => todos.filter((t) => t.completed),
    [todos],
  );

  const sections: TodoSection[] = useMemo(() => {
    const todayKey = getDateKey();
    const todayPending = pendingTodos.filter(
      (t) => getDateKey(new Date(t.createdAt)) === todayKey,
    );
    const earlierPending = pendingTodos.filter(
      (t) => getDateKey(new Date(t.createdAt)) !== todayKey,
    );

    const result: TodoSection[] = [];
    if (todayPending.length > 0) result.push({ title: "TODAY", data: todayPending });
    if (earlierPending.length > 0) result.push({ title: "EARLIER", data: earlierPending });
    if (completedTodos.length > 0) result.push({ title: "DONE", data: completedTodos });
    return result;
  }, [pendingTodos, completedTodos]);

  const renderItem = useCallback(
    ({ item, index }: { item: Todo; index: number }) => (
      <TodoItem
        item={item}
        index={index}
        isFocused={item.id === focusTodoId}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onFocus={handleFocus}
      />
    ),
    [handleToggle, handleDelete, handleFocus, focusTodoId],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: TodoSection }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {section.title !== "DONE" && (
          <Text style={styles.sectionCount}>{section.data.length}</Text>
        )}
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: Todo) => item.id, []);

  const listContentStyle = useMemo(
    () => ({
      paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16,
      paddingHorizontal: 20,
    }),
    [insets.bottom],
  );

  if (!hydrated) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Animated.View entering={FadeIn.duration(600)}>
          <Text style={styles.loadingText}>todo</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(500)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Text style={styles.wordmark}>TODO</Text>
        {pendingTodos.length > 0 && (
          <Text style={styles.countBadge}>{pendingTodos.length}</Text>
        )}
      </Animated.View>

      {/* Input */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(100)}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Add a task..."
          placeholderTextColor="rgba(255, 255, 255, 0.2)"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          blurOnSubmit={false}
          selectionColor={GOLD}
        />
        {inputText.trim().length > 0 && (
          <Pressable
            onPress={handleSubmit}
            style={styles.addButton}
            accessibilityRole="button"
            accessibilityLabel="Add task"
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        )}
      </Animated.View>

      {/* Section list or empty state */}
      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyDot} />
          <Text style={styles.emptyTitle}>No tasks yet</Text>
          <Text style={styles.emptySubtitle}>
            Type above to add your first task
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={keyExtractor}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

interface TodoItemProps {
  item: Todo;
  index: number;
  isFocused: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onFocus: (todo: Todo) => void;
}

const TodoItem = React.memo(function TodoItem({
  item,
  index,
  isFocused,
  onToggle,
  onDelete,
  onFocus,
}: TodoItemProps): React.JSX.Element {
  return (
    <Animated.View
      entering={FadeInUp.duration(300).delay(index * 40)}
      exiting={FadeOut.duration(200)}
      style={[styles.todoRow, isFocused && styles.todoRowFocused]}
    >
      {/* Toggle circle */}
      <Pressable
        onPress={() => onToggle(item.id)}
        style={styles.toggleButton}
        accessibilityRole="button"
        accessibilityLabel={
          item.completed ? "Mark as incomplete" : "Mark as complete"
        }
      >
        <View
          style={[
            styles.circle,
            item.completed && styles.circleFilled,
          ]}
        >
          {item.completed && <View style={styles.checkInner} />}
        </View>
      </Pressable>

      {/* Text */}
      <Text
        style={[styles.todoText, item.completed && styles.todoTextCompleted]}
        numberOfLines={2}
      >
        {item.text}
      </Text>

      {/* Focus button — only for pending todos */}
      {!item.completed && (
        <Pressable
          onPress={() => onFocus(item)}
          style={styles.focusButton}
          accessibilityRole="button"
          accessibilityLabel="Start focus session for this task"
        >
          <View style={styles.focusIcon}>
            <View style={styles.focusTriangle} />
          </View>
        </Pressable>
      )}

      {/* Delete */}
      <Pressable
        onPress={() => onDelete(item.id)}
        style={styles.deleteButton}
        accessibilityRole="button"
        accessibilityLabel="Delete task"
      >
        <Text style={styles.deleteText}>×</Text>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: GOLD,
    fontSize: 28,
    fontWeight: "200",
    letterSpacing: 12,
    textTransform: "uppercase",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  wordmark: {
    color: GOLD,
    fontSize: 17,
    fontWeight: "300",
    letterSpacing: 8,
  },
  countBadge: {
    color: "rgba(212, 168, 67, 0.5)",
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },

  // Input
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(212, 168, 67, 0.15)",
    paddingBottom: 12,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "300",
    letterSpacing: 0.5,
    padding: 0,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 168, 67, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  addButtonText: {
    color: GOLD,
    fontSize: 18,
    fontWeight: "300",
    lineHeight: 20,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    color: "rgba(212, 168, 67, 0.4)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 4,
  },
  sectionCount: {
    color: "rgba(212, 168, 67, 0.25)",
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -60,
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(212, 168, 67, 0.3)",
    marginBottom: 20,
  },
  emptyTitle: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
    fontWeight: "300",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "rgba(255, 255, 255, 0.2)",
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.5,
  },

  // Todo item
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  todoRowFocused: {
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
    paddingLeft: 8,
    marginLeft: -10,
  },
  toggleButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(212, 168, 67, 0.4)",
  },
  circleFilled: {
    backgroundColor: GOLD,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  checkInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BG,
  },
  todoText: {
    flex: 1,
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 15,
    fontWeight: "300",
    letterSpacing: 0.3,
    marginLeft: 4,
  },
  todoTextCompleted: {
    opacity: 0.3,
    textDecorationLine: "line-through",
  },
  focusButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  focusIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(212, 168, 67, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  focusTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftColor: "rgba(212, 168, 67, 0.4)",
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    marginLeft: 2,
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    color: "rgba(255, 255, 255, 0.15)",
    fontSize: 16,
    fontWeight: "300",
  },
});

export default withScreenErrorBoundary(TodoScreen, "TodoScreen");
