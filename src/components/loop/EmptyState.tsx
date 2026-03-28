import { View, Text } from "react-native";

export function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <Text className="text-ora-gold text-6xl mb-6">◉</Text>
      <Text className="text-white/40 text-lg text-center leading-7">
        Tap the camera to start{"\n"}tracking your time
      </Text>
    </View>
  );
}
