import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Keyboard,
  Alert,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { transcribe } from "@/api/archive-client";
import { devError, devLog } from "@/utils/logger";
import { colors } from "@/theme/colors";

type Mode = "idle" | "recording" | "uploading" | "result" | "error";

interface Props {
  /** Distance from bottom safe area (tab bar already accounted for by parent). */
  bottomOffset?: number;
}

export const VoiceButton = React.memo(function VoiceButton({
  bottomOffset = 80,
}: Props): React.JSX.Element | null {
  const [mode, setMode] = useState<Mode>("idle");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulse = useSharedValue(1);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardWillShow", () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener("keyboardWillHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (mode === "recording") {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 700 }),
          withTiming(1, { duration: 700 }),
        ),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [mode, pulse]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setError("microphone permission denied");
        setMode("error");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setMode("recording");
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      devError("VoiceButton", "start failed", err);
      setError("couldn't start recording");
      setMode("error");
    }
  }, []);

  const stopAndUpload = useCallback(async (): Promise<void> => {
    const rec = recordingRef.current;
    recordingRef.current = null;
    if (!rec) {
      setMode("idle");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode("uploading");
    try {
      await rec.stopAndUnloadAsync();
    } catch (err) {
      devError("VoiceButton", "stop failed", err);
    }
    const uri = rec.getURI();
    if (!uri) {
      setMode("idle");
      return;
    }

    try {
      const form = new FormData();
      // React Native's FormData accepts { uri, name, type } despite the standard type.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (form as any).append("audio", {
        uri,
        name: "voice.m4a",
        type: "audio/m4a",
      });
      const data = await transcribe.upload(form);
      setTranscript(data.text ?? "");
      setMode("result");
      devLog("VoiceButton", "transcript", (data.text || "").slice(0, 80));
    } catch (err) {
      devError("VoiceButton", "upload failed", err);
      setError((err as Error).message.slice(0, 120));
      setMode("error");
    }
  }, []);

  const dismiss = useCallback((): void => {
    setTranscript(null);
    setError(null);
    setMode("idle");
  }, []);

  if (keyboardVisible && mode === "idle") return null;

  return (
    <>
      {/* Floating button */}
      {mode !== "result" && mode !== "error" ? (
        <View
          style={[styles.buttonWrap, { bottom: bottomOffset }]}
          pointerEvents="box-none"
        >
          <Animated.View style={[outerStyle]}>
            <Pressable
              onPressIn={() => void startRecording()}
              onPressOut={() => void stopAndUpload()}
              style={[
                styles.button,
                mode === "recording" && styles.buttonActive,
                mode === "uploading" && styles.buttonUploading,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Hold to record voice note"
            >
              <View style={styles.dot} />
            </Pressable>
          </Animated.View>
        </View>
      ) : null}

      {/* Transcript toast */}
      {mode === "result" && transcript !== null ? (
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(200)}
          style={[styles.toast, { bottom: bottomOffset }]}
        >
          <Pressable onPress={dismiss} style={styles.toastInner}>
            <Text style={styles.toastLabel}>VOICE → ARCHIVE</Text>
            <Text style={styles.toastText} numberOfLines={4}>
              {transcript || "(empty)"}
            </Text>
            <Text style={styles.toastDismiss}>tap to dismiss</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      {/* Error toast */}
      {mode === "error" && error ? (
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(200)}
          style={[styles.toast, styles.toastError, { bottom: bottomOffset }]}
        >
          <Pressable
            onPress={() => {
              setError(null);
              setMode("idle");
            }}
            style={styles.toastInner}
            onLongPress={() =>
              Alert.alert("voice capture error", error, [{ text: "ok" }])
            }
          >
            <Text style={[styles.toastLabel, styles.toastErrorLabel]}>VOICE ×</Text>
            <Text style={styles.toastText} numberOfLines={2}>
              {error}
            </Text>
            <Text style={styles.toastDismiss}>tap to dismiss · hold for detail</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </>
  );
});

const styles = StyleSheet.create({
  buttonWrap: {
    position: "absolute",
    right: 20,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.palette.neutral700,
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  buttonUploading: {
    backgroundColor: colors.palette.gold700,
    borderColor: colors.accent,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: colors.palette.neutral800,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,168,67,0.35)",
    borderRadius: 10,
    padding: 14,
  },
  toastError: {
    borderColor: "rgba(255,80,80,0.35)",
  },
  toastInner: {},
  toastLabel: {
    color: "rgba(212,168,67,0.55)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 3,
    marginBottom: 6,
  },
  toastErrorLabel: {
    color: "rgba(255,120,120,0.7)",
  },
  toastText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "300",
    lineHeight: 20,
    marginBottom: 6,
  },
  toastDismiss: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 10,
    fontWeight: "300",
    letterSpacing: 0.5,
  },
});
