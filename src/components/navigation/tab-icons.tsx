import React from "react";
import { View, StyleSheet } from "react-native";

interface TabIconProps {
  color: string;
  size: number;
}

/** Concentric circle — echoes the pulsing ring / shutter motif. */
export const LoopsIcon = React.memo(function LoopsIcon({
  color,
  size,
}: TabIconProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.loopsOuter,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
      ]}
    >
      <View
        style={[
          styles.loopsInner,
          {
            width: size * 0.45,
            height: size * 0.45,
            borderRadius: (size * 0.45) / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
});

/** Three horizontal bars — list motif for todo. */
export const TodoIcon = React.memo(function TodoIcon({
  color,
  size,
}: TabIconProps): React.JSX.Element {
  const barWidth = size * 0.7;
  const barHeight = 1.5;
  const gap = size * 0.18;
  return (
    <View style={[styles.todoContainer, { width: size, height: size }]}>
      <View
        style={{ width: barWidth, height: barHeight, backgroundColor: color, borderRadius: 1 }}
      />
      <View
        style={{
          width: barWidth,
          height: barHeight,
          backgroundColor: color,
          borderRadius: 1,
          marginTop: gap,
        }}
      />
      <View
        style={{
          width: barWidth * 0.65,
          height: barHeight,
          backgroundColor: color,
          borderRadius: 1,
          marginTop: gap,
        }}
      />
    </View>
  );
});

/** Circle with clock hand — timer motif for pomodoro. */
export const PomodoroIcon = React.memo(function PomodoroIcon({
  color,
  size,
}: TabIconProps): React.JSX.Element {
  const handLength = size * 0.28;
  return (
    <View
      style={[
        styles.pomodoroOuter,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
      ]}
    >
      {/* Vertical hand (12 o'clock) */}
      <View
        style={[
          styles.pomodoroHand,
          {
            width: 1.5,
            height: handLength,
            backgroundColor: color,
            bottom: size / 2 - 1,
          },
        ]}
      />
      {/* Horizontal hand (3 o'clock) */}
      <View
        style={[
          styles.pomodoroHandH,
          {
            width: handLength * 0.7,
            height: 1.5,
            backgroundColor: color,
            left: size / 2 - 1,
          },
        ]}
      />
      {/* Center dot */}
      <View
        style={{
          width: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: color,
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  loopsOuter: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  loopsInner: {},
  todoContainer: {
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 2,
  },
  pomodoroOuter: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  pomodoroHand: {
    position: "absolute",
    borderRadius: 1,
  },
  pomodoroHandH: {
    position: "absolute",
    borderRadius: 1,
  },
});
