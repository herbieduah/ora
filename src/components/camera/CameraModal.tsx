import { useRef, useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { CameraView, type CameraType } from "expo-camera";

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
  onPickGallery: () => void;
}

export function CameraModal({
  visible,
  onClose,
  onCapture,
  onPickGallery,
}: CameraModalProps) {
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>("front");
  const [capturing, setCapturing] = useState(false);

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });
      if (photo?.uri) {
        onCapture(photo.uri);
      }
    } finally {
      setCapturing(false);
    }
  };

  const flipCamera = () => {
    setFacing((prev) => (prev === "front" ? "back" : "front"));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View className="flex-1 bg-black">
        <CameraView
          ref={cameraRef}
          facing={facing}
          style={{ flex: 1 }}
        />

        {/* Top bar */}
        <View className="absolute top-14 left-0 right-0 flex-row justify-between px-5">
          <Pressable onPress={onClose}>
            <Text className="text-white text-lg font-medium">Cancel</Text>
          </Pressable>
          <Pressable onPress={flipCamera}>
            <Text className="text-white text-lg">⟳</Text>
          </Pressable>
        </View>

        {/* Bottom bar */}
        <View className="absolute bottom-10 left-0 right-0 flex-row items-center justify-around px-10">
          <Pressable onPress={() => { onClose(); onPickGallery(); }}>
            <View className="w-12 h-12 rounded-lg bg-white/20 items-center justify-center">
              <Text className="text-white text-xs">Gallery</Text>
            </View>
          </Pressable>

          <Pressable onPress={takePicture} disabled={capturing}>
            <View
              className="w-20 h-20 rounded-full border-4 border-white items-center justify-center"
              style={{ opacity: capturing ? 0.5 : 1 }}
            >
              <View className="w-16 h-16 rounded-full bg-white" />
            </View>
          </Pressable>

          <View className="w-12" />
        </View>
      </View>
    </Modal>
  );
}
