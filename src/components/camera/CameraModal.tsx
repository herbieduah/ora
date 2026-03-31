import { useRef, useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { CameraView, type CameraType, type CameraMountError } from "expo-camera";
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
  FadeInDown,
  FadeInUp,
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
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  // Force CameraView remount on each open — avoids stale native view
  // tags and guarantees a fresh onCameraReady callback.
  const [cameraKey, setCameraKey] = useState(0);
  const insets = useSafeAreaInsets();

  const shutterScale = useSharedValue(1);
  const shutterInnerOpacity = useSharedValue(0.9);

  const shutterAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  const shutterInnerStyle = useAnimatedStyle(() => ({
    opacity: shutterInnerOpacity.value,
  }));

  useEffect(() => {
    if (visible) {
      setCameraReady(false);
      setCapturing(false);
      setPreviewUri(null);
      setCameraKey((k) => k + 1);
    }
  }, [visible]);

  const handleCameraReady = useCallback(() => {
    devLog("CameraModal", "onCameraReady fired");
    setCameraReady(true);
  }, []);

  const handleMountError = useCallback((event: CameraMountError) => {
    logErrorVoid("CameraView.onMountError", event.message);
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
      devLog("takePicture", "calling takePictureAsync...");
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });
      devLog("takePicture", "result:", { hasPhoto: !!photo, uri: photo?.uri?.slice(-30) });
      if (photo?.uri) {
        setPreviewUri(photo.uri);
      } else {
        // takePictureAsync returned undefined — native camera ref is likely stale.
        // Fall back to system camera via expo-image-picker.
        devLog("takePicture", "no photo returned, falling back to system camera");
        const ImagePicker = await import("expo-image-picker");
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          allowsEditing: false,
        });
        if (!result.canceled && result.assets[0]?.uri) {
          setPreviewUri(result.assets[0].uri);
        }
      }
    } catch (error) {
      logErrorVoid("takePicture", error);
    } finally {
      setCapturing(false);
    }
  };

  const handleRetake = useCallback(() => {
    setPreviewUri(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (previewUri) {
      onCapture(previewUri);
    }
  }, [previewUri, onCapture]);

  const flipCamera = () => {
    setCameraReady(false);
    setFacing((prev) => (prev === "front" ? "back" : "front"));
    setCameraKey((k) => k + 1);
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
        {previewUri ? (
          <View style={s.previewContainer}>
            <Animated.View
              entering={FadeIn.duration(400)}
              style={[s.previewImageFrame, { marginTop: insets.top + 12 }]}
            >
              <View style={s.previewGoldBorder}>
                <Image
                  source={previewUri}
                  style={s.previewImage}
                  contentFit="cover"
                />
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(500).delay(200)}
              style={s.previewPrompt}
            >
              <View style={s.previewAccentLine} />
              <Text style={s.previewLabel}>BEGIN THIS MOMENT</Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(400).delay(300)}
              style={[s.previewControls, { paddingBottom: insets.bottom + 32 }]}
            >
              <Pressable
                onPress={handleRetake}
                style={s.retakeButton}
                accessibilityRole="button"
                accessibilityLabel="Retake photo"
              >
                <Text style={s.retakeText}>RETAKE</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                style={s.confirmButton}
                accessibilityRole="button"
                accessibilityLabel="Start tracking"
              >
                <Text style={s.confirmText}>START</Text>
              </Pressable>
            </Animated.View>
          </View>
        ) : (
          <>
            <CameraView
              key={cameraKey}
              ref={cameraRef}
              facing={facing}
              style={s.camera}
              onCameraReady={handleCameraReady}
              onMountError={handleMountError}
            />

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
          </>
        )}

        {/* Close button — always visible */}
        <Animated.View
          entering={FadeIn.duration(300).delay(200)}
          style={[s.topBar, { top: insets.top + 12 }]}
        >
          <IconButton onPress={onClose}>
            <Text style={s.closeIcon}>×</Text>
          </IconButton>
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

  // Preview
  previewContainer: {
    flex: 1,
    backgroundColor: "#050505",
  },
  previewImageFrame: {
    flex: 1,
    margin: 20,
    marginTop: 0,
    marginBottom: 12,
  },
  previewGoldBorder: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "rgba(212, 168, 67, 0.25)",
    overflow: "hidden",
  },
  previewImage: {
    flex: 1,
  },
  previewPrompt: {
    alignItems: "center",
    paddingVertical: 16,
  },
  previewAccentLine: {
    width: 24,
    height: 1,
    backgroundColor: "rgba(212, 168, 67, 0.4)",
    marginBottom: 12,
  },
  previewLabel: {
    color: "rgba(212, 168, 67, 0.5)",
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 5,
  },
  previewControls: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 16,
  },
  retakeButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  retakeText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
    fontWeight: "300",
    letterSpacing: 3,
  },
  confirmButton: {
    flex: 1.4,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(212, 168, 67, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    color: "#050505",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 4,
  },
});
