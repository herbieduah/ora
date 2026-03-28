import { useEffect, useState } from "react";
import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useLoopStore } from "@/store/useLoopStore";
import { formatElapsed, formatDateLabel } from "@/utils/time";
import type { Loop } from "@/types";

export default function DayDetailScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const loadDay = useLoopStore((s) => s.loadDay);
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!date) return;
    loadDay(date).then((data) => {
      setLoops(data?.loops ?? []);
      setLoading(false);
    });
  }, [date, loadDay]);

  const totalTracked = loops.reduce((sum, l) => {
    if (l.endTime) return sum + (l.endTime - l.startTime);
    return sum;
  }, 0);

  return (
    <SafeAreaView className="flex-1 bg-ora-dark">
      <View className="flex-row items-center px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-ora-gold text-lg">← Back</Text>
        </Pressable>
        <Text className="text-white text-xl font-semibold ml-4">
          {date ? formatDateLabel(date) : ""}
        </Text>
      </View>

      {/* Summary */}
      <View className="flex-row justify-around px-5 pb-4">
        <View className="items-center">
          <Text className="text-white/40 text-xs uppercase">Loops</Text>
          <Text className="text-white text-2xl font-light">{loops.length}</Text>
        </View>
        <View className="items-center">
          <Text className="text-white/40 text-xs uppercase">Tracked</Text>
          <Text className="text-white text-2xl font-light">
            {formatElapsed(totalTracked)}
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white/30">Loading...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4">
          {[...loops].reverse().map((loop) => (
            <View
              key={loop.id}
              className="mb-3 rounded-2xl overflow-hidden bg-ora-card"
              style={{ height: 200 }}
            >
              <Image
                source={{ uri: loop.photoUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute bottom-0 left-0 right-0 p-3 bg-black/50">
                <Text className="text-white text-lg font-medium">
                  {loop.endTime
                    ? formatElapsed(loop.endTime - loop.startTime)
                    : "Active"}
                </Text>
                <Text className="text-white/50 text-xs">
                  {new Date(loop.startTime).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
