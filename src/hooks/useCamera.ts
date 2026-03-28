import { useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { savePhoto } from "@/utils/photo";
import { useLoopStore } from "@/store/useLoopStore";

export function useCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const startLoop = useLoopStore((s) => s.startLoop);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setCameraVisible(true);
  };

  const closeCamera = () => {
    setCameraVisible(false);
  };

  const captureAndStartLoop = async (tempUri: string) => {
    const permanentUri = await savePhoto(tempUri);
    await startLoop(permanentUri);
    setCameraVisible(false);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const permanentUri = await savePhoto(result.assets[0].uri);
      await startLoop(permanentUri);
    }
  };

  return {
    cameraVisible,
    openCamera,
    closeCamera,
    captureAndStartLoop,
    pickFromGallery,
    hasPermission: permission?.granted ?? false,
  };
}
