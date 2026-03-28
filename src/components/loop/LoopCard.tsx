import { View, Text, Image } from "react-native";
import type { Loop } from "@/types";
import { formatElapsed } from "@/utils/time";

interface LoopCardProps {
  loop: Loop;
  elapsed?: number; // live elapsed for active loop
}

export function LoopCard({ loop, elapsed }: LoopCardProps) {
  const duration = loop.endTime
    ? loop.endTime - loop.startTime
    : elapsed ?? Date.now() - loop.startTime;

  return (
    <View className="flex-1 rounded-2xl overflow-hidden bg-ora-card">
      <Image
        source={{ uri: loop.photoUri }}
        className="w-full h-full"
        resizeMode="cover"
      />
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <Text className="text-white text-2xl font-light tracking-wide">
          {formatElapsed(duration)}
        </Text>
        <Text className="text-white/50 text-xs mt-1">
          {new Date(loop.startTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
      {!loop.endTime && (
        <View className="absolute top-3 right-3 px-2 py-1 rounded-full bg-ora-gold/90">
          <Text className="text-black text-xs font-semibold">LIVE</Text>
        </View>
      )}
    </View>
  );
}
