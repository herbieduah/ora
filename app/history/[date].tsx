import { useMemo, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { BlurView } from "@sbaiahmed1/react-native-blur";
import type { Loop } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { useLoopStore } from "@/store/useLoopStore";
import { formatElapsed, formatDateLabel } from "@/utils/time";
import { VerticalPageCarousel } from "@/components/ui/vertical-page-carousel";
import { withScreenErrorBoundary } from "@/components/error-boundary";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const GOLD = "#D4A843";
const BG = "#050505";
const getLoopKey = (item: { id: string }): string => item.id;
const CAROUSEL_SCALE: [number, number, number] = [0.88, 1, 0.88];
const CAROUSEL_OPACITY: [number, number, number] = [0.6, 1, 0.6];

function DayDetailScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const loadDay = useLoopStore((s) => s.loadDay);

  const loops = useMemo(
    () => (date ? loadDay(date)?.loops ?? [] : []),
    [date, loadDay],
  );

  const displayLoops = useMemo(() => [...loops].reverse(), [loops]);
  const carouselData = useMemo(
    () => displayLoops.map((l) => ({ ...l, image: { uri: l.photoUri } })),
    [displayLoops],
  );

  const renderCarouselItem = useCallback(
    ({ item }: { item: Loop & { image: { uri: string } } }) => (
      <View style={s.cardOverlay}>
        <BlurView blurType="dark" blurAmount={6} style={StyleSheet.absoluteFill} />
        <View style={s.cardOverlayContent}>
          <View>
            <Text style={s.cardDuration}>
              {item.endTime
                ? formatElapsed(item.endTime - item.startTime)
                : "Active"}
            </Text>
            <Text style={s.cardTime}>
              {new Date(item.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          {item.endTime ? null : (
            <View style={s.activeBadge}>
              <View style={s.activeDot} />
              <Text style={s.activeText}>ACTIVE</Text>
            </View>
          )}
        </View>
      </View>
    ),
    [],
  );

  const totalTracked = useMemo(
    () =>
      loops.reduce((sum, l) => {
        if (l.endTime) return sum + (l.endTime - l.startTime);
        return sum;
      }, 0),
    [loops],
  );

  return (
    <SafeAreaView style={s.container}>
      <Animated.View entering={FadeIn.duration(400).delay(50)} style={s.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={s.backButton}>
          <Text style={s.backChevron}>‹</Text>
        </Pressable>
        <Text style={s.title}>
          {date ? formatDateLabel(date).toUpperCase() : ""}
        </Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      <Animated.View entering={FadeIn.duration(500).delay(150)} style={s.statsRow}>
        <View style={s.statBlock}>
          <View style={s.statAccent} />
          <Text style={s.statLabel}>LOOPS</Text>
          <Text style={s.statValue}>{loops.length}</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statBlock}>
          <View style={s.statAccent} />
          <Text style={s.statLabel}>TRACKED</Text>
          <Text style={s.statValue}>{formatElapsed(totalTracked)}</Text>
        </View>
      </Animated.View>

      <VerticalPageCarousel
        data={carouselData}
        itemHeight={SCREEN_HEIGHT * 0.7}
        cardMargin={14}
        cardSpacing={8}
        pagingEnabled
        scaleRange={CAROUSEL_SCALE}
        opacityRange={CAROUSEL_OPACITY}
        useBlur
        keyExtractor={getLoopKey}
        renderItem={renderCarouselItem}
      />
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
    paddingBottom: 12,
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
    letterSpacing: 5,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  statAccent: {
    width: 24,
    height: 1,
    backgroundColor: "rgba(212, 168, 67, 0.3)",
    marginBottom: 12,
  },
  statLabel: {
    color: "rgba(212, 168, 67, 0.5)",
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 4,
    marginBottom: 6,
  },
  statValue: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 28,
    fontWeight: "200",
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(212, 168, 67, 0.12)",
    marginVertical: 12,
  },

  // Card overlay (inside carousel cards)
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  cardOverlayContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: 16,
  },
  cardDuration: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "300",
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },
  cardTime: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 1,
    marginTop: 3,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 168, 67, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: GOLD,
  },
  activeText: {
    color: GOLD,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
  },
});

export default withScreenErrorBoundary(DayDetailScreen, "DayDetailScreen");
