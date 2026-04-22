import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useLoopStore } from "@/store/useLoopStore";
import { ErrorBoundary } from "@/components/error-boundary";
import Config from "@/config";
import { colors } from "@/theme/colors";

export default function RootLayout() {
  const hydrate = useLoopStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
          <Stack.Screen
            name="history/list"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="history/[date]"
            options={{ animation: "slide_from_right" }}
          />
        </Stack>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
