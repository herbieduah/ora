import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme/colors";
import { todos as todosApi, type ApiTodo } from "@/api/archive-client";
import { enqueue } from "@/sync";
import { devError } from "@/utils/logger";

export const VaultTodosList = React.memo(function VaultTodosList(): React.JSX.Element {
  const [items, setItems] = useState<ApiTodo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const res = await todosApi.list({ limit: 20, sync_vault: true });
      setItems(res.todos.filter((t) => t.vault_path));
      setError(null);
    } catch (err) {
      devError("VaultTodosList", err);
      setError("archive unreachable");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback((todo: ApiTodo): void => {
    if (!items) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextStatus: ApiTodo["status"] = todo.status === "done" ? "open" : "done";
    setItems(
      items.map((t) => (t.id === todo.id ? { ...t, status: nextStatus } : t)),
    );
    enqueue("PATCH", `/todos/${todo.id}`, { status: nextStatus });
  }, [items]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>VAULT</Text>
        <Pressable
          onPress={() => void refresh()}
          accessibilityRole="button"
          accessibilityLabel="Refresh vault todos"
          hitSlop={8}
        >
          <Text style={styles.refresh}>·</Text>
        </Pressable>
      </View>
      {items === null && !error ? (
        <ActivityIndicator color={colors.accent} size="small" />
      ) : error ? (
        <Text style={styles.muted}>{error}</Text>
      ) : items && items.length === 0 ? (
        <Text style={styles.muted}>no open vault tasks</Text>
      ) : (
        items?.map((t) => (
          <Animated.View key={t.id} entering={FadeIn.duration(240)} style={styles.row}>
            <Pressable
              onPress={() => toggle(t)}
              style={styles.toggle}
              accessibilityRole="button"
              accessibilityLabel={t.status === "done" ? "Mark as open" : "Mark as done"}
            >
              <View
                style={[
                  styles.circle,
                  t.status === "done" && styles.circleFilled,
                ]}
              />
            </Pressable>
            <View style={styles.content}>
              <Text
                style={[
                  styles.text,
                  t.status === "done" && styles.textDone,
                ]}
                numberOfLines={2}
              >
                {t.text}
              </Text>
              {t.vault_path ? (
                <Text style={styles.path} numberOfLines={1}>
                  {t.vault_path}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        ))
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(212,168,67,0.15)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    color: "rgba(212,168,67,0.5)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 4,
  },
  refresh: {
    color: "rgba(212,168,67,0.4)",
    fontSize: 24,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  toggle: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.4)",
  },
  circleFilled: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  content: {
    flex: 1,
    paddingTop: 4,
  },
  text: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "300",
    lineHeight: 20,
  },
  textDone: {
    opacity: 0.35,
    textDecorationLine: "line-through",
  },
  path: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    fontWeight: "300",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  muted: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    fontWeight: "300",
  },
});
