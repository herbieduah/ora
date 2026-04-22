import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { usePomodoroTimer } from "@/hooks/use-pomodoro-timer";
import { withScreenErrorBoundary } from "@/components/error-boundary";
import { TAB_BAR_HEIGHT } from "@/components/navigation/ora-tab-bar";
import { colors } from "@/theme/colors";
import { formatCountdown } from "@/utils/time";

const SCREEN_WIDTH = Dimensions.get("window").width;
const RING_SIZE = SCREEN_WIDTH * 0.55;
const GOLD = colors.accent;
const GOLD_DIM = "rgba(212, 168, 67, 0.15)";
const BG = colors.background;

/** Pulsing ring animation — reuses the Loops tab visual language. */
function PulsingRing(): React.JSX.Element {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.15);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.pulsingRing, animatedStyle]}>
      <View style={styles.pulsingRingBorder} />
    </Animated.View>
  );
}

/** Progress ring — opacity increases as progress fills. */
function ProgressRing({ progress }: { progress: number }): React.JSX.Element {
  const progressOpacity = 0.1 + progress * 0.4;
  return (
    <View
      style={[
        styles.progressRing,
        { opacity: progressOpacity },
      ]}
    />
  );
}

/** Live countdown display — isolates per-second re-renders.
 *  Transition logic lives in PomodoroWatcher (always mounted in tabs layout). */
function LiveCountdown(): React.JSX.Element {
  const { remainingMs, phase, progress } = usePomodoroTimer();
  const focusTodoText = usePomodoroStore((s) => s.focusTodoText);
  const phaseLabel = phase === "work" ? "WORK" : phase === "break" ? "BREAK" : "";

  return (
    <>
      <ProgressRing progress={progress} />
      <Text style={styles.countdown}>{formatCountdown(remainingMs)}</Text>
      {phase !== "idle" && <Text style={styles.phaseLabel}>{phaseLabel}</Text>}
      {focusTodoText && phase === "work" && (
        <Text style={styles.focusTodoText} numberOfLines={1}>
          {focusTodoText}
        </Text>
      )}
    </>
  );
}

function PomodoroScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const phase = usePomodoroStore((s) => s.phase);
  const sessionsCompleted = usePomodoroStore((s) => s.sessionsCompleted);
  const hydrated = usePomodoroStore((s) => s.hydrated);
  const hydrate = usePomodoroStore((s) => s.hydrate);
  const startWork = usePomodoroStore((s) => s.startWork);
  const reset = usePomodoroStore((s) => s.reset);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const handleStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startWork();
  }, [startWork]);

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reset();
  }, [reset]);

  if (!hydrated) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Animated.View entering={FadeIn.duration(600)}>
          <Text style={styles.loadingText}>focus</Text>
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
        <Text style={styles.wordmark}>FOCUS</Text>
      </Animated.View>

      {/* Center ring area */}
      <View style={styles.ringArea}>
        <Animated.View
          entering={FadeIn.duration(800).delay(200)}
          style={styles.ringContainer}
        >
          {/* Pulsing ambient ring (idle & break) */}
          {(phase === "idle" || phase === "break") && <PulsingRing />}

          {/* Static outer ring */}
          <View style={styles.outerRing} />

          {/* Countdown + progress */}
          <LiveCountdown />
        </Animated.View>

        {/* Controls */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(400)}
          style={styles.controls}
        >
          {phase === "idle" && (
            <Pressable
              onPress={handleStart}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Start focus session"
            >
              <Text style={styles.actionText}>START</Text>
            </Pressable>
          )}
          {phase === "work" && (
            <Pressable
              onPress={handleReset}
              style={styles.actionButtonSubtle}
              accessibilityRole="button"
              accessibilityLabel="Reset timer"
            >
              <Text style={styles.actionTextSubtle}>RESET</Text>
            </Pressable>
          )}
          {phase === "break" && (
            <Pressable
              onPress={handleReset}
              style={styles.actionButtonSubtle}
              accessibilityRole="button"
              accessibilityLabel="Skip break"
            >
              <Text style={styles.actionTextSubtle}>SKIP</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Sessions count */}
        <Animated.View
          entering={FadeIn.duration(500).delay(600)}
          style={[
            styles.sessionsContainer,
            { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 },
          ]}
        >
          {sessionsCompleted > 0 && (
            <Text style={styles.sessionsText}>
              {sessionsCompleted} {sessionsCompleted === 1 ? "SESSION" : "SESSIONS"}
            </Text>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  wordmark: {
    color: GOLD,
    fontSize: 17,
    fontWeight: "300",
    letterSpacing: 8,
  },

  // Ring area
  ringArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
  },
  ringContainer: {
    width: RING_SIZE + 40,
    height: RING_SIZE + 40,
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1,
    borderColor: "rgba(212, 168, 67, 0.2)",
  },
  pulsingRing: {
    position: "absolute",
    width: RING_SIZE + 30,
    height: RING_SIZE + 30,
    borderRadius: (RING_SIZE + 30) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pulsingRingBorder: {
    width: "100%",
    height: "100%",
    borderRadius: (RING_SIZE + 30) / 2,
    borderWidth: 0.5,
    borderColor: GOLD,
  },
  progressRing: {
    position: "absolute",
    width: RING_SIZE - 8,
    height: RING_SIZE - 8,
    borderRadius: (RING_SIZE - 8) / 2,
    backgroundColor: GOLD_DIM,
  },

  // Countdown
  countdown: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "200",
    letterSpacing: 4,
    fontVariant: ["tabular-nums"],
  },
  phaseLabel: {
    color: "rgba(212, 168, 67, 0.4)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 4,
    marginTop: 8,
  },
  focusTodoText: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 12,
    fontWeight: "300",
    letterSpacing: 0.5,
    marginTop: 12,
    maxWidth: RING_SIZE - 40,
    textAlign: "center",
  },

  // Controls
  controls: {
    marginTop: 40,
    alignItems: "center",
  },
  actionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(212, 168, 67, 0.5)",
    backgroundColor: "rgba(212, 168, 67, 0.06)",
  },
  actionText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 6,
  },
  actionButtonSubtle: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  actionTextSubtle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 4,
  },

  // Sessions
  sessionsContainer: {
    position: "absolute",
    bottom: 0,
    alignItems: "center",
  },
  sessionsText: {
    color: "rgba(212, 168, 67, 0.3)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 3,
  },
});

export default withScreenErrorBoundary(PomodoroScreen, "PomodoroScreen");
