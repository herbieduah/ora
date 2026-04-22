import { useMemo, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { BlurView } from "@sbaiahmed1/react-native-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useLoopStore } from "@/store/useLoopStore";
import { formatElapsed, formatDateLabel } from "@/utils/time";
import { VerticalPageCarousel } from "@/components/ui/vertical-page-carousel";
import { withScreenErrorBoundary } from "@/components/error-boundary";
import type { Loop } from "@/types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const GOLD = "#D4A843";
const BG = "#050505";
const getLoopKey = (item: { id: string }): string => item.id;
const CAROUSEL_SCALE: [number, number, number] = [0.88, 1, 0.88];
const CAROUSEL_OPACITY: [number, number, number] = [0.6, 1, 0.6];

function DayDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const totalTracked = useMemo(
    () =>
      loops.reduce((sum, l) => {
        if (l.endTime) return sum + (l.endTime - l.startTime);
        return sum;
      }, 0),
    [loops],
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

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [router]);

  return (
    <View style={s.container}>
      {/* Base layer — carousel fills entire screen */}
      {loops.length === 0 ? (
        <View style={s.emptyContainer}>
          <View style={s.emptyDot} />
          <Text style={s.emptyTitle}>No loops</Text>
          <Text style={s.emptySubtitle}>No moments captured this day</Text>
        </View>
      ) : (
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
      )}

      {/* Overlaid header — back button, date, compact stats */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(50)}
        style={[s.header, { paddingTop: insets.top + 4 }]}
      >
        <View style={s.headerRow}>
          <Pressable
            onPress={handleBack}
            style={s.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={s.backChevron}>‹</Text>
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={s.title}>
              {date ? formatDateLabel(date).toUpperCase() : ""}
            </Text>
            <Text style={s.statsLine}>
              {loops.length} {loops.length === 1 ? "loop" : "loops"} · {formatElapsed(totalTracked)}
            </Text>
          </View>
          <View style={s.headerSpacer} />
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // Header — absolute overlay like home screen
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    color: GOLD,
    fontSize: 14,
    fontWeight: "300",
    letterSpacing: 5,
  },
  statsLine: {
    color: "rgba(212, 168, 67, 0.35)",
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 1,
    marginTop: 4,
  },
  headerSpacer: {
    width: 44,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
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
    textTransform: "uppercase",
    marginBottom: 12,
  },
  emptySubtitle: {
    color: "rgba(255, 255, 255, 0.2)",
    fontSize: 13,
    fontWeight: "400",
    textAlign: "center",
    letterSpacing: 0.5,
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
