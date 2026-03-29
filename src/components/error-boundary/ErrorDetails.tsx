import React, { ErrorInfo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ErrorDetailsProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  onReset?: () => void;
}

/**
 * Root-level error fallback UI.
 * Shown when the entire app crashes — no navigation available.
 */
export function ErrorDetails({
  error,
  errorInfo,
  onReset,
}: ErrorDetailsProps) {
  return (
    <SafeAreaView className="flex-1 bg-ora-dark items-center justify-center px-8">
      <Text className="text-4xl mb-4">⚠️</Text>
      <Text className="text-white text-xl font-semibold text-center mb-3">
        Something went wrong
      </Text>
      <Text className="text-white/60 text-base text-center mb-6">
        The app encountered an unexpected error. Please try again.
      </Text>

      {__DEV__ && (
        <View className="w-full bg-ora-card rounded-2xl p-4 mb-6 max-h-48">
          <Text className="text-ora-gold text-xs uppercase tracking-wider mb-2 font-semibold">
            Error
          </Text>
          <ScrollView>
            <Text className="text-white/80 text-sm font-mono">
              {error.message}
            </Text>
            {errorInfo?.componentStack && (
              <Text className="text-white/40 text-xs mt-2 font-mono">
                {errorInfo.componentStack.slice(0, 500)}
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      {onReset && (
        <Pressable
          onPress={onReset}
          className="bg-ora-gold px-8 py-3 rounded-xl active:opacity-80"
        >
          <Text className="text-ora-dark text-base font-semibold">
            Try Again
          </Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}
