import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useLoopStore } from "@/store/useLoopStore";
import { formatDateLabel } from "@/utils/time";
import { withScreenErrorBoundary } from "@/components/error-boundary";

const GOLD = "#D4A843";
const BG = "#050505";

function HistoryListScreen() {
  const router = useRouter();
  const dateKeys = useLoopStore((s) => s.dateKeys);

  return (
    <SafeAreaView style={s.container}>
      <Animated.View entering={FadeIn.duration(400).delay(50)} style={s.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={s.backButton}>
          <Text style={s.backChevron}>‹</Text>
        </Pressable>
        <Text style={s.title}>HISTORY</Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      {dateKeys.length === 0 ? (
        <Animated.View entering={FadeIn.duration(600).delay(200)} style={s.emptyContainer}>
          <View style={s.emptyDot} />
          <Text style={s.emptyTitle}>NO MOMENTS YET</Text>
          <Text style={s.emptySubtitle}>
            Your tracked days will{"\n"}appear here
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={dateKeys}
          keyExtractor={(item) => item}
          contentContainerStyle={s.listContent}
          renderItem={({ item: dateKey, index }) => (
            <Animated.View entering={FadeInUp.duration(350).delay(100 + index * 60)}>
              <Pressable
                onPress={() => router.push(`/history/${dateKey}`)}
                style={s.row}
              >
                <View style={s.rowAccent} />
                <View style={s.rowContent}>
                  <Text style={s.rowDate}>{formatDateLabel(dateKey)}</Text>
                  <Text style={s.rowKey}>{dateKey}</Text>
                </View>
                <Text style={s.rowArrow}>›</Text>
              </Pressable>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backChevron: {
    color: GOLD,
    fontSize: 32,
    fontWeight: "200",
    marginTop: -2,
  },
  title: {
    color: GOLD,
    fontSize: 14,
    fontWeight: "300",
    letterSpacing: 6,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -60,
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(212, 168, 67, 0.4)",
    marginBottom: 24,
  },
  emptyTitle: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 14,
    fontWeight: "300",
    letterSpacing: 5,
    marginBottom: 12,
  },
  emptySubtitle: {
    color: "rgba(255, 255, 255, 0.2)",
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 20,
    textAlign: "center",
    letterSpacing: 0.5,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(212, 168, 67, 0.08)",
  },
  rowAccent: {
    width: 2,
    height: 32,
    borderRadius: 1,
    backgroundColor: "rgba(212, 168, 67, 0.35)",
    marginRight: 16,
  },
  rowContent: {
    flex: 1,
  },
  rowDate: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 17,
    fontWeight: "300",
    letterSpacing: 0.5,
  },
  rowKey: {
    color: "rgba(212, 168, 67, 0.35)",
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 1,
    marginTop: 4,
  },
  rowArrow: {
    color: "rgba(255, 255, 255, 0.15)",
    fontSize: 22,
    fontWeight: "200",
  },
});

export default withScreenErrorBoundary(HistoryListScreen, "HistoryListScreen");
