import React, { useMemo, useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { BlurView } from "@sbaiahmed1/react-native-blur";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useLoopStore } from "@/store/useLoopStore";
import { useTimer } from "@/hooks/useTimer";
import { useCamera } from "@/hooks/useCamera";
import { useMidnightRollover } from "@/hooks/useMidnightRollover";
import { useAppState } from "@/hooks/useAppState";
import { formatElapsed } from "@/utils/time";
import { CameraModal } from "@/components/camera/CameraModal";
import { VerticalPageCarousel } from "@/components/ui/vertical-page-carousel";
import { withScreenErrorBoundary } from "@/components/error-boundary";
import type { Loop } from "@/types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const getLoopKey = (item: { id: string }): string => item.id;
const CAROUSEL_SCALE: [number, number, number] = [0.88, 1, 0.88];
const CAROUSEL_OPACITY: [number, number, number] = [0.6, 1, 0.6];
const RING_SIZE = SCREEN_WIDTH * 0.55;

function PulsingRing() {
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
      <View style={styles.pulsingRingInner} />
    </Animated.View>
  );
}

function SecondPulsingRing() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.08);

  useEffect(() => {
    scale.value = withDelay(
      1500,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      1500,
      withRepeat(
        withSequence(
          withTiming(0.18, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.08, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.secondRing, animatedStyle]}>
      <View style={styles.secondRingInner} />
    </Animated.View>
  );
}

function ShutterButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const innerGlow = useSharedValue(0.25);

  useEffect(() => {
    innerGlow.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.25, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [innerGlow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: innerGlow.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.92, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 200 });
      }}
    >
      <Animated.View
        style={[
          styles.shutterOuter,
          useAnimatedStyle(() => ({
            transform: [{ scale: scale.value }],
          })),
        ]}
      >
        <View style={styles.shutterMiddle}>
          <Animated.View style={[styles.shutterGlow, glowStyle]} />
          <View style={styles.shutterInner}>
            <View style={styles.shutterDot} />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

/** Self-contained live timer — isolates per-second re-renders to this leaf. */
function LiveElapsed({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = React.useState(() => Date.now() - startTime);
  React.useEffect(() => {
    setElapsed(Date.now() - startTime);
    const id = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(id);
  }, [startTime]);
  return <Text style={styles.loopDuration}>{formatElapsed(elapsed)}</Text>;
}

function MenuDots({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.menuButton}>
      <View style={styles.menuDot} />
      <View style={styles.menuDot} />
      <View style={styles.menuDot} />
    </Pressable>
  );
}

function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const loops = useLoopStore((s) => s.loops);
  const activeLoopId = useLoopStore((s) => s.activeLoopId);
  const hydrated = useLoopStore((s) => s.hydrated);
  const hydrate = useLoopStore((s) => s.hydrate);
  const elapsed = useTimer();
  const {
    cameraVisible,
    openCamera,
    closeCamera,
    captureAndStartLoop,
    pickFromGallery,
  } = useCamera();

  useMidnightRollover();
  useAppState(hydrate);

  const activeLoop = loops.find((l) => l.id === activeLoopId);
  const displayLoops = useMemo(() => [...loops].reverse(), [loops]);
  const carouselData = useMemo(
    () => displayLoops.map((l) => ({ ...l, image: { uri: l.photoUri } })),
    [displayLoops],
  );

  const renderCarouselItem = useCallback(
    ({ item }: { item: Loop & { image: { uri: string } } }) => (
      <View style={styles.loopOverlay}>
        <BlurView blurType="dark" blurAmount={6} style={StyleSheet.absoluteFill} />
        <View style={styles.loopOverlayContent}>
          <View style={styles.loopInfo}>
            {item.endTime ? (
              <Text style={styles.loopDuration}>
                {formatElapsed(item.endTime - item.startTime)}
              </Text>
            ) : (
              <LiveElapsed startTime={item.startTime} />
            )}
            <Text style={styles.loopTime}>
              {new Date(item.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          {!item.endTime && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
      </View>
    ),
    [],
  );

  if (!hydrated) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Animated.View entering={FadeIn.duration(600)}>
          <Text style={styles.loadingText}>ora</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Base layer — carousel or empty state fills entire screen */}
      {displayLoops.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.ringContainer}>
            <SecondPulsingRing />
            <PulsingRing />
            <Animated.View entering={FadeIn.duration(1000).delay(300)}>
              <View style={styles.staticRing}>
                <View style={styles.staticRingDot} />
              </View>
            </Animated.View>
          </View>

          <Animated.View entering={FadeInUp.duration(800).delay(600)} style={styles.emptyTextContainer}>
            <Text style={styles.emptyTitle}>Begin</Text>
            <Text style={styles.emptySubtitle}>
              Capture a moment to start{"\n"}tracking where your time goes
            </Text>
          </Animated.View>
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

      {/* Overlaid header — 3 columns: ORA | timer | dots */}
      <Animated.View entering={FadeInDown.duration(500).delay(100)} style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.wordmark}>ORA</Text>
        </View>
        <View style={styles.headerCenter}>
          {activeLoop && (
            <>
              <Text style={styles.timerLabel}>TRACKING</Text>
              <Text style={styles.timerValue}>{formatElapsed(elapsed)}</Text>
            </>
          )}
        </View>
        <View style={styles.headerRight}>
          <MenuDots onPress={() => router.push("/history/list")} />
        </View>
      </Animated.View>

      {/* Overlaid shutter */}
      <Animated.View entering={FadeInUp.duration(500).delay(400)} style={[styles.shutterContainer, { paddingBottom: insets.bottom + 16 }]}>
        <ShutterButton onPress={openCamera} />
      </Animated.View>

      <CameraModal
        visible={cameraVisible}
        onClose={closeCamera}
        onCapture={captureAndStartLoop}
        onPickGallery={pickFromGallery}
      />
    </View>
  );
}

const GOLD = "#D4A843";
const GOLD_DIM = "rgba(212, 168, 67, 0.15)";
const GOLD_GLOW = "rgba(212, 168, 67, 0.35)";
const BG = "#050505";


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

  // Header — 3-column overlay: ORA | timer | dots
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  wordmark: {
    color: GOLD,
    fontSize: 17,
    fontWeight: "300",
    letterSpacing: 8,
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  menuDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },

  timerLabel: {
    color: "rgba(212, 168, 67, 0.4)",
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 3,
    marginBottom: 2,
  },
  timerValue: {
    color: GOLD,
    fontSize: 18,
    fontWeight: "300",
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
  },
  ringContainer: {
    width: RING_SIZE + 60,
    height: RING_SIZE + 60,
    alignItems: "center",
    justifyContent: "center",
  },
  pulsingRing: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pulsingRingInner: {
    width: "100%",
    height: "100%",
    borderRadius: RING_SIZE / 2,
    borderWidth: 1,
    borderColor: GOLD,
  },
  secondRing: {
    position: "absolute",
    width: RING_SIZE + 40,
    height: RING_SIZE + 40,
    borderRadius: (RING_SIZE + 40) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  secondRingInner: {
    width: "100%",
    height: "100%",
    borderRadius: (RING_SIZE + 40) / 2,
    borderWidth: 0.5,
    borderColor: GOLD,
  },
  staticRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD_DIM,
    alignItems: "center",
    justifyContent: "center",
  },
  staticRingDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: GOLD,
  },
  emptyTextContainer: {
    alignItems: "center",
    marginTop: 32,
  },
  emptyTitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 22,
    fontWeight: "300",
    letterSpacing: 6,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  emptySubtitle: {
    color: "rgba(255, 255, 255, 0.25)",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 22,
    textAlign: "center",
    letterSpacing: 0.5,
  },

  // Loop overlay (inside carousel cards)
  loopOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  loopOverlayContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: 16,
  },
  loopInfo: {},
  loopDuration: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "300",
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },
  loopTime: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 1,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 168, 67, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: GOLD,
  },
  liveText: {
    color: GOLD,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
  },

  // Shutter button — overlaid at bottom
  shutterContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: "center",
    paddingTop: 12,
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: "rgba(212, 168, 67, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterMiddle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(212, 168, 67, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterGlow: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GOLD_GLOW,
  },
  shutterInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(212, 168, 67, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD,
  },
});

export default withScreenErrorBoundary(HomeScreen, "HomeScreen");
