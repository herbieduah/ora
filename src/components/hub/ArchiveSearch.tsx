/**
 * Debounced search input against Archive memory.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { colors } from "@/theme/colors";
import { memory as memoryApi } from "@/api/archive-client";
import { devError } from "@/utils/logger";

interface Result {
  id: string;
  memory: string;
  score?: number;
  category?: string;
}

export const ArchiveSearch = React.memo(function ArchiveSearch(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inflightAbort = useRef<AbortController | null>(null);

  const run = useCallback(async (q: string): Promise<void> => {
    if (inflightAbort.current) inflightAbort.current.abort();
    const ctrl = new AbortController();
    inflightAbort.current = ctrl;
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await memoryApi.search(q, 6);
      if (ctrl.signal.aborted) return;
      setResults(
        (res.result.results || []).map((r) => ({
          id: r.id,
          memory: r.memory,
          score: r.score,
          category: r.metadata?.category,
        })),
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") devError("ArchiveSearch", err);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => void run(query), 300);
    return () => clearTimeout(handle);
  }, [query, run]);

  const renderItem = useCallback(
    ({ item }: { item: Result }) => (
      <Animated.View entering={FadeIn.duration(240)} style={styles.resultRow}>
        {item.category ? (
          <Text style={styles.resultCategory}>{item.category}</Text>
        ) : null}
        <Text style={styles.resultText} numberOfLines={3}>
          {item.memory}
        </Text>
      </Animated.View>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="search memory…"
          placeholderTextColor="rgba(255,255,255,0.2)"
          selectionColor={colors.accent}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {loading ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : query.length > 0 ? (
          <Pressable
            onPress={() => setQuery("")}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={styles.clearButton}
            hitSlop={8}
          >
            <Text style={styles.clearText}>×</Text>
          </Pressable>
        ) : null}
      </View>
      {query.trim().length > 0 && results.length === 0 && !loading ? (
        <Text style={styles.emptyText}>nothing relevant in Archive</Text>
      ) : null}
      {results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          scrollEnabled={false}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(212,168,67,0.15)",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingBottom: 6,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "300",
    padding: 0,
  },
  clearButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 20,
    lineHeight: 22,
  },
  resultRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  resultCategory: {
    color: "rgba(212,168,67,0.55)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  resultText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "300",
    lineHeight: 20,
  },
  emptyText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    fontWeight: "300",
    fontStyle: "italic",
    marginTop: 12,
  },
});
