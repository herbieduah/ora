import { View, Text, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLoopStore } from "@/store/useLoopStore";
import { useTimer } from "@/hooks/useTimer";
import { useCamera } from "@/hooks/useCamera";
import { useMidnightRollover } from "@/hooks/useMidnightRollover";
import { useAppState } from "@/hooks/useAppState";
import { formatElapsed } from "@/utils/time";
import { CameraModal } from "@/components/camera/CameraModal";

export default function HomeScreen() {
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
  useAppState(() => hydrate());

  const activeLoop = loops.find((l) => l.id === activeLoopId);
  const displayLoops = [...loops].reverse(); // newest first

  if (!hydrated) {
    return (
      <SafeAreaView className="flex-1 bg-ora-dark items-center justify-center">
        <Text className="text-white/50 text-lg">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-ora-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
        <Pressable onPress={() => router.push("/history/list")}>
          <Text className="text-white/60 text-2xl">☰</Text>
        </Pressable>
        <Text className="text-white text-xl font-semibold tracking-wider">
          ora
        </Text>
        <View className="w-8" />
      </View>

      {/* Active Timer */}
      {activeLoop && (
        <View className="items-center pb-4">
          <Text className="text-ora-gold text-4xl font-light tracking-wide">
            {formatElapsed(elapsed)}
          </Text>
        </View>
      )}

      {/* Loop List or Empty State */}
      {displayLoops.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-white/30 text-lg text-center leading-7">
            Tap the camera to start{"\n"}tracking your time
          </Text>
        </View>
      ) : (
        <View className="flex-1 px-4">
          {/* Placeholder for VerticalPageCarousel — will be wired after design questions */}
          {displayLoops.map((loop) => (
            <View
              key={loop.id}
              className="mb-3 rounded-2xl overflow-hidden bg-ora-card"
              style={{ height: 200 }}
            >
              <Image
                source={{ uri: loop.photoUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute bottom-0 left-0 right-0 p-3 bg-black/50">
                <Text className="text-white text-lg font-medium">
                  {loop.endTime
                    ? formatElapsed(loop.endTime - loop.startTime)
                    : formatElapsed(elapsed)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Camera Button */}
      <View className="items-center pb-6 pt-3">
        <Pressable
          onPress={openCamera}
          className="w-20 h-20 rounded-full bg-white/10 border-4 border-ora-gold items-center justify-center active:scale-95"
        >
          <View className="w-16 h-16 rounded-full bg-ora-gold/20 items-center justify-center">
            <Text className="text-ora-gold text-2xl">◉</Text>
          </View>
        </Pressable>
      </View>

      {/* Camera Modal */}
      <CameraModal
        visible={cameraVisible}
        onClose={closeCamera}
        onCapture={captureAndStartLoop}
        onPickGallery={pickFromGallery}
      />
    </SafeAreaView>
  );
}
