import React, { useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors } from "@/theme/colors";
import { formatCountdown } from "@/utils/time";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { usePomodoroTimer } from "@/hooks/use-pomodoro-timer";
import { LoopsIcon, TodoIcon, PomodoroIcon, HubIcon } from "./tab-icons";

export const TAB_BAR_HEIGHT = 56;

const GOLD = colors.accent;
const GOLD_DIM = "rgba(212, 168, 67, 0.5)";
const INACTIVE = "rgba(255, 255, 255, 0.25)";

const TAB_ICONS: Record<string, React.ComponentType<{ color: string; size: number }>> = {
  index: LoopsIcon,
  todo: TodoIcon,
  pomodoro: PomodoroIcon,
  hub: HubIcon,
};

const TAB_LABELS: Record<string, string> = {
  index: "Loops",
  todo: "Todo",
  pomodoro: "Focus",
  hub: "Hub",
};

/** Tiny live countdown — isolates per-second re-renders to this leaf. */
function PomodoroTabIndicator(): React.JSX.Element | null {
  const { remainingMs, phase } = usePomodoroTimer();

  if (phase === "idle") return null;

  const text = formatCountdown(remainingMs);
  const isBreak = phase === "break";

  return (
    <Text style={[styles.timerText, isBreak && styles.timerTextBreak]}>
      {text}
    </Text>
  );
}

export const OraTabBar = React.memo(function OraTabBar({
  state,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const pomodoroPhase = usePomodoroStore((s) => s.phase);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.border} />
      <View style={styles.tabs}>
        {state.routes.map((route, index) => {
          const isActive = state.index === index;
          const Icon = TAB_ICONS[route.name];
          const label = TAB_LABELS[route.name] ?? route.name;
          const isPomodoroTab = route.name === "pomodoro";
          const pomodoroActive = pomodoroPhase !== "idle";

          return (
            <TabButton
              key={route.key}
              routeKey={route.key}
              routeName={route.name}
              isActive={isActive}
              Icon={Icon}
              label={label}
              isPomodoroTab={isPomodoroTab}
              pomodoroActive={pomodoroActive}
              navigation={navigation}
            />
          );
        })}
      </View>
    </View>
  );
});

interface TabButtonProps {
  routeKey: string;
  routeName: string;
  isActive: boolean;
  Icon: React.ComponentType<{ color: string; size: number }> | undefined;
  label: string;
  isPomodoroTab: boolean;
  pomodoroActive: boolean;
  navigation: BottomTabBarProps["navigation"];
}

const TabButton = React.memo(function TabButton({
  routeKey,
  routeName,
  isActive,
  Icon,
  label,
  isPomodoroTab,
  pomodoroActive,
  navigation,
}: TabButtonProps): React.JSX.Element {
  const handlePress = useCallback(() => {
    const event = navigation.emit({
      type: "tabPress",
      target: routeKey,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate(routeName);
    }
  }, [navigation, routeKey, routeName]);

  // Pomodoro tab icon glows gold when timer is active, even if tab isn't selected
  const iconColor =
    isActive
      ? GOLD
      : isPomodoroTab && pomodoroActive
        ? GOLD_DIM
        : INACTIVE;

  return (
    <Pressable
      onPress={handlePress}
      style={styles.tab}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
    >
      {Icon && <Icon color={iconColor} size={22} />}
      {isPomodoroTab && pomodoroActive ? (
        <PomodoroTabIndicator />
      ) : isActive ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.activeDot} />
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  border: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(212, 168, 67, 0.08)",
  },
  tabs: {
    flexDirection: "row",
    height: TAB_BAR_HEIGHT,
    alignItems: "center",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: TAB_BAR_HEIGHT,
    gap: 4,
  },
  activeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: GOLD,
  },
  timerText: {
    color: GOLD,
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },
  timerTextBreak: {
    color: "rgba(212, 168, 67, 0.35)",
  },
});
