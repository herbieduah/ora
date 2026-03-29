import React, { ErrorInfo, useCallback } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

interface ScreenErrorFallbackProps {
  screenName: string;
  error: Error;
  errorInfo: ErrorInfo | null;
  onRetry?: () => void;
}

/**
 * Screen-level error fallback UI.
 * Provides retry and go-back actions using expo-router.
 */
export function ScreenErrorFallback({
  screenName,
  error,
  errorInfo,
  onRetry,
}: ScreenErrorFallbackProps) {
  const router = useRouter();

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-ora-dark items-center justify-center px-8">
      <Text className="text-4xl mb-4">⚠️</Text>
      <Text className="text-white text-xl font-semibold text-center mb-3">
        Something went wrong
      </Text>
      <Text className="text-white/60 text-base text-center mb-6">
        We couldn't load this screen. Please try again or go back.
      </Text>

      {__DEV__ && (
        <View className="w-full bg-ora-card rounded-2xl p-4 mb-6 max-h-40">
          <Text className="text-ora-gold text-xs uppercase tracking-wider mb-1 font-semibold">
            Screen: {screenName}
          </Text>
          <ScrollView>
            <Text className="text-white/80 text-sm">{error.message}</Text>
            {errorInfo?.componentStack && (
              <Text className="text-white/40 text-xs mt-2">
                {errorInfo.componentStack.slice(0, 300)}
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      <View className="flex-row gap-3">
        {onRetry && (
          <Pressable
            onPress={onRetry}
            className="bg-ora-gold px-6 py-3 rounded-xl active:opacity-80"
          >
            <Text className="text-ora-dark text-base font-semibold">
              Try Again
            </Text>
          </Pressable>
        )}

        {router.canGoBack() && (
          <Pressable
            onPress={handleGoBack}
            className="border-2 border-ora-gold px-6 py-3 rounded-xl active:opacity-80"
          >
            <Text className="text-ora-gold text-base font-semibold">
              Go Back
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
