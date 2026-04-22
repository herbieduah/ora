import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { withScreenErrorBoundary } from "@/components/error-boundary";
import { TAB_BAR_HEIGHT } from "@/components/navigation/ora-tab-bar";
import { ReflectCard } from "@/components/hub/ReflectCard";
import { ArchiveSearch } from "@/components/hub/ArchiveSearch";
import { VaultTodosList } from "@/components/hub/VaultTodosList";
import { colors } from "@/theme/colors";

function HubScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeIn.duration(500)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Text style={styles.wordmark}>HUB</Text>
      </Animated.View>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 80, // leave room for voice button
        }}
        showsVerticalScrollIndicator={false}
      >
        <ReflectCard />
        <VaultTodosList />
        <ArchiveSearch />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  wordmark: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: "300",
    letterSpacing: 8,
  },
});

export default withScreenErrorBoundary(HubScreen, "HubScreen");
