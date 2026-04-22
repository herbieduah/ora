import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { OraTabBar } from "@/components/navigation/ora-tab-bar";
import { PomodoroWatcher } from "@/components/pomodoro/pomodoro-watcher";

const renderTabBar = (props: BottomTabBarProps): React.JSX.Element => (
  <OraTabBar {...props} />
);

export default function TabsLayout(): React.JSX.Element {
  return (
    <>
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
      </Tabs>
    </>
  );
}
