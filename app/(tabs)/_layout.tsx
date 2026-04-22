import { View } from "react-native";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OraTabBar, TAB_BAR_HEIGHT } from "@/components/navigation/ora-tab-bar";
import { PomodoroWatcher } from "@/components/pomodoro/pomodoro-watcher";
import { VoiceButton } from "@/components/voice/VoiceButton";

const renderTabBar = (props: BottomTabBarProps): React.JSX.Element => (
  <OraTabBar {...props} />
);

export default function TabsLayout(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <PomodoroWatcher />
      <Tabs
        tabBar={renderTabBar}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Loops",
          }}
        />
        <Tabs.Screen
          name="todo"
          options={{
            title: "Todo",
          }}
        />
        <Tabs.Screen
          name="pomodoro"
          options={{
            title: "Focus",
          }}
        />
        <Tabs.Screen
          name="hub"
          options={{
            title: "Hub",
          }}
        />
      </Tabs>
      {/* Floating voice button — above tab bar + safe-area. */}
      <VoiceButton bottomOffset={TAB_BAR_HEIGHT + insets.bottom + 16} />
    </View>
  );
}
