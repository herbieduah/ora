import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme/colors";
import { reflect } from "@/api/archive-client";
import { devError } from "@/utils/logger";

interface ReflectQuestion {
  text: string;
  type: "text" | "choice";
  choices?: string[];
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; questions: ReflectQuestion[] }
  | { kind: "answered"; question: string; answer: string }
  | { kind: "unavailable"; reason: string };

export const ReflectCard = React.memo(function ReflectCard(): React.JSX.Element {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [textAnswer, setTextAnswer] = useState("");

  const loadQuestions = useCallback(async (): Promise<void> => {
    setState({ kind: "loading" });
    try {
      const res = await reflect.questions({});
      if (!res.questions || res.questions.length === 0) {
        setState({ kind: "unavailable", reason: "no questions this round" });
        return;
      }
      setState({ kind: "ready", questions: res.questions });
    } catch (err) {
      const detail = (err as { detail?: string; status?: number }).detail;
      const status = (err as { status?: number }).status;
      if (status === 501) {
        setState({
          kind: "unavailable",
          reason: detail ?? "reflection not configured",
        });
      } else {
        devError("ReflectCard", err);
        setState({ kind: "unavailable", reason: "archive unreachable" });
      }
    }
  }, []);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const submit = useCallback(
    async (question: string, answer: string): Promise<void> => {
      if (!answer.trim()) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setState({ kind: "answered", question, answer });
      setTextAnswer("");
      try {
        await reflect.answer({ question, answer });
      } catch (err) {
        devError("ReflectCard", "answer post failed", err);
        // Not fatal — sync queue could pick this up later if we enqueued, but
        // reflection answers are intentionally direct to avoid stale context.
      }
    },
    [],
  );

  const firstQuestion = useMemo(
    () => (state.kind === "ready" ? state.questions[0] : null),
    [state],
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>REFLECT</Text>
        <Pressable
          onPress={() => void loadQuestions()}
          accessibilityRole="button"
          accessibilityLabel="Refresh reflection questions"
          style={styles.refreshButton}
          hitSlop={8}
        >
          <Text style={styles.refreshDot}>·</Text>
        </Pressable>
      </View>

      {state.kind === "loading" ? (
        <ActivityIndicator color={colors.accent} />
      ) : state.kind === "unavailable" ? (
        <Text style={styles.muted}>{state.reason}</Text>
      ) : state.kind === "answered" ? (
        <Animated.View entering={FadeIn.duration(300)}>
          <Text style={styles.question}>{state.question}</Text>
          <Text style={styles.answerConfirm}>"{state.answer}" — saved</Text>
        </Animated.View>
      ) : firstQuestion ? (
        <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}>
          <Text style={styles.question}>{firstQuestion.text}</Text>
          {firstQuestion.type === "choice" && firstQuestion.choices ? (
            <View style={styles.choiceRow}>
              {firstQuestion.choices.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => void submit(firstQuestion.text, c)}
                  style={styles.choiceChip}
                  accessibilityRole="button"
                  accessibilityLabel={`Answer: ${c}`}
                >
                  <Text style={styles.choiceText}>{c}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.textInputRow}>
              <TextInput
                style={styles.input}
                value={textAnswer}
                onChangeText={setTextAnswer}
                placeholder="reflect…"
                placeholderTextColor="rgba(255,255,255,0.2)"
                multiline
                selectionColor={colors.accent}
                returnKeyType="send"
                onSubmitEditing={() => void submit(firstQuestion.text, textAnswer)}
              />
              {textAnswer.trim().length > 0 && (
                <Pressable
                  onPress={() => void submit(firstQuestion.text, textAnswer)}
                  accessibilityRole="button"
                  accessibilityLabel="Submit reflection"
                  style={styles.submit}
                >
                  <Text style={styles.submitText}>→</Text>
                </Pressable>
              )}
            </View>
          )}
        </Animated.View>
      ) : (
        <Text style={styles.muted}>tap · to start</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(212,168,67,0.15)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  label: {
    color: "rgba(212,168,67,0.5)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 4,
  },
  refreshButton: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshDot: {
    color: "rgba(212,168,67,0.4)",
    fontSize: 24,
    lineHeight: 20,
  },
  question: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 17,
    fontWeight: "300",
    letterSpacing: 0.3,
    lineHeight: 24,
    marginBottom: 14,
  },
  textInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingBottom: 6,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "300",
    minHeight: 24,
    padding: 0,
  },
  submit: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  submitText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: "300",
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,168,67,0.3)",
  },
  choiceText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "300",
    letterSpacing: 0.5,
  },
  answerConfirm: {
    color: "rgba(212,168,67,0.7)",
    fontSize: 13,
    fontWeight: "300",
    fontStyle: "italic",
    letterSpacing: 0.3,
  },
  muted: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    fontWeight: "300",
    letterSpacing: 0.5,
  },
});
