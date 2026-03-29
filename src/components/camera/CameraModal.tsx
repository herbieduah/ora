import { useRef, useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { CameraView, type CameraType } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { logErrorVoid } from "@/utils/log-error";
import { devLog } from "@/utils/logger";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
} from "react-native-reanimated";

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
  onPickGallery: () => void;
}

function IconButton({
  onPress,
  children,
  size = 44,
}: {
  onPress: () => void;
  children: React.ReactNode;
  size?: number;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.88, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150 });
      }}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.25)",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            alignItems: "center",
            justifyContent: "center",
          },
          animStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export function CameraModal({
  visible,
  onClose,
  onCapture,
  onPickGallery,
}: CameraModalProps) {
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const insets = useSafeAreaInsets();

  const shutterScale = useSharedValue(1);
  const shutterInnerOpacity = useSharedValue(0.9);

  const shutterAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  const shutterInnerStyle = useAnimatedStyle(() => ({
    opacity: shutterInnerOpacity.value,
  }));

  // Reset cameraReady every time the modal opens so we wait for a
  // fresh onCameraReady from the native layer. On iOS, Modal keeps
  // children mounted when hidden, so the old native view tag goes
  // stale — using it causes "Unable to find CameraView with tag".
  useEffect(() => {
    if (visible) {
      setCameraReady(false);
      setCapturing(false);
    }
  }, [visible]);

  const handleCameraReady = useCallback(() => {
    setCameraReady(true);
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current || capturing || !cameraReady) {
      devLog("takePicture", "Guard blocked:", { ref: !!cameraRef.current, capturing, cameraReady });
      return;
    }
    setCapturing(true);

    shutterScale.value = withSequence(
      withTiming(0.85, { duration: 80 }),
      withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) }),
    );
    shutterInnerOpacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(0.9, { duration: 300 }),
    );

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });
      if (photo?.uri) {
        onCapture(photo.uri);
      }
    } catch (error) {
      logErrorVoid("takePicture", error);
    } finally {
      setCapturing(false);
    }
  };

  const flipCamera = () => {
    setCameraReady(false);
    setFacing((prev) => (prev === "front" ? "back" : "front"));
  };

  // Gallery: pick FIRST (while modal stays open), then close.
  // iOS can't dismiss one modal while presenting another — if we
  // called onClose() before onPickGallery(), the image picker
  // would silently fail to present.
  const handleGallery = useCallback(() => {
    onPickGallery();
  }, [onPickGallery]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={s.container}>
        <CameraView
          ref={cameraRef}
          facing={facing}
          style={s.camera}
          onCameraReady={handleCameraReady}
        />

        {/* Close button */}
        <Animated.View
          entering={FadeIn.duration(300).delay(200)}
          style={[s.topBar, { top: insets.top + 12 }]}
        >
          <IconButton onPress={onClose}>
            <Text style={s.closeIcon}>×</Text>
          </IconButton>
        </Animated.View>

        {/* Bottom bar — gallery | shutter | flip */}
        <Animated.View
          entering={FadeIn.duration(300).delay(300)}
          style={[s.bottomBarOuter, { bottom: insets.bottom + 24 }]}
        >
          <View style={s.bottomBarInner}>
            <IconButton onPress={handleGallery} size={48}>
              <View style={s.galleryIcon}>
                <View style={s.galleryInner} />
              </View>
            </IconButton>

            <Pressable onPress={takePicture} disabled={capturing || !cameraReady}>
              <Animated.View
                style={[
                  s.shutterOuter,
                  shutterAnimStyle,
                  !cameraReady ? { opacity: 0.4 } : undefined,
                ]}
              >
                <View style={s.shutterMiddle}>
                  <Animated.View style={[s.shutterInner, shutterInnerStyle]} />
                </View>
              </Animated.View>
            </Pressable>

            <IconButton onPress={flipCamera} size={48}>
              <View style={s.flipIconContainer}>
                <View style={s.flipArcTop} />
                <View style={s.flipArcBottom} />
              </View>
            </IconButton>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  closeIcon: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 22,
    fontWeight: "200",
    marginTop: -1,
  },
  bottomBarOuter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bottomBarInner: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  flipIconContainer: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  flipArcTop: {
    width: 14,
    height: 7,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: "rgba(255, 255, 255, 0.7)",
    marginBottom: 2,
  },
  flipArcBottom: {
    width: 14,
    height: 7,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },
  galleryIcon: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  shutterOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterMiddle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
});
