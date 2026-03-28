import { Pressable, View, Text } from "react-native";

interface CameraButtonProps {
  onPress: () => void;
}

export function CameraButton({ onPress }: CameraButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="w-20 h-20 rounded-full bg-white/10 border-4 border-ora-gold items-center justify-center active:scale-95"
    >
      <View className="w-16 h-16 rounded-full bg-ora-gold/20 items-center justify-center">
        <Text className="text-ora-gold text-2xl">◉</Text>
      </View>
    </Pressable>
  );
}
