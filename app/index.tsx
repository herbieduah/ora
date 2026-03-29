import { useMemo, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { withScreenErrorBoundary } from "@/components/error-boundary";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.wordmark}>ORA</Text>
        <MenuDots onPress={() => router.push("/history/list")} />
      </Animated.View>

      {/* Timer - shown when a loop is active */}
      {activeLoop && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.timerContainer}>
          <Text style={styles.timerLabel}>TRACKING</Text>
          <Text style={styles.timerValue}>{formatElapsed(elapsed)}</Text>
        </Animated.View>
      )}

      {/* Content area */}
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
        <Animated.View entering={FadeIn.duration(400)} style={styles.loopList}>
          {displayLoops.map((loop, index) => (
            <Animated.View
              key={loop.id}
              entering={FadeInUp.duration(400).delay(index * 80)}
              style={styles.loopCard}
            >
              <Image
                source={loop.photoUri}
                style={styles.loopImage}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.loopOverlay}>
                <View style={styles.loopInfo}>
                  <Text style={styles.loopDuration}>
                    {loop.endTime
                      ? formatElapsed(loop.endTime - loop.startTime)
                      : formatElapsed(elapsed)}
                  </Text>
                  <Text style={styles.loopTime}>
                    {new Date(loop.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                {!loop.endTime && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {/* Shutter button */}
      <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.shutterContainer}>
        <ShutterButton onPress={openCamera} />
      </Animated.View>

      <CameraModal
        visible={cameraVisible}
        onClose={closeCamera}
        onCapture={captureAndStartLoop}
        onPickGallery={pickFromGallery}
      />
    </SafeAreaView>
  );
}

const GOLD = "#D4A843";
const GOLD_DIM = "rgba(212, 168, 67, 0.15)";
const GOLD_GLOW = "rgba(212, 168, 67, 0.35)";
const BG = "#050505";
const CARD_BG = "#111111";

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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  wordmark: {
    color: GOLD,
    fontSize: 17,
    fontWeight: "300",
    letterSpacing: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 5,
  },
  menuDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },

  // Timer
  timerContainer: {
    alignItems: "center",
    paddingBottom: 12,
  },
  timerLabel: {
    color: "rgba(212, 168, 67, 0.5)",
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 4,
    marginBottom: 4,
  },
  timerValue: {
    color: GOLD,
    fontSize: 42,
    fontWeight: "200",
    letterSpacing: 4,
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

  // Loop cards
  loopList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loopCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: CARD_BG,
    height: 200,
  },
  loopImage: {
    width: "100%",
    height: "100%",
  },
  loopOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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

  // Shutter button
  shutterContainer: {
    alignItems: "center",
    paddingBottom: 24,
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
