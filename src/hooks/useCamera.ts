import { useState } from "react";
import { useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { savePhoto } from "@/utils/photo";
import { useLoopStore } from "@/store/useLoopStore";
import { logErrorVoid } from "@/utils/log-error";

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

  const captureAndStartLoop = (tempUri: string) => {
    try {
      const { uri, filename } = savePhoto(tempUri);
      startLoop(uri, filename);
    } catch (error) {
      logErrorVoid("captureAndStartLoop", error);
    }
    setCameraVisible(false);
  };

  // Gallery: the image picker presents over the camera modal.
  // We close the camera modal AFTER the pick completes — not before.
  // iOS can't dismiss one modal while presenting another.
  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const { uri, filename } = savePhoto(result.assets[0].uri);
        startLoop(uri, filename);
      }
    } catch (error) {
      logErrorVoid("pickFromGallery", error);
    }
    setCameraVisible(false);
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
