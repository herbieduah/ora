import { View, Text, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLoopStore } from "@/store/useLoopStore";
import { formatDateLabel } from "@/utils/time";

export default function HistoryListScreen() {
  const router = useRouter();
  const dateKeys = useLoopStore((s) => s.dateKeys);

  return (
    <SafeAreaView className="flex-1 bg-ora-dark">
      <View className="flex-row items-center px-5 pt-2 pb-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-ora-gold text-lg">← Back</Text>
        </Pressable>
        <Text className="text-white text-xl font-semibold ml-4">History</Text>
      </View>

      {dateKeys.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white/30 text-lg">No days recorded yet</Text>
        </View>
      ) : (
        <FlatList
          data={dateKeys}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item: dateKey }) => (
            <Pressable
              onPress={() => router.push(`/history/${dateKey}`)}
              className="py-4 border-b border-white/10"
            >
              <Text className="text-white text-lg">
                {formatDateLabel(dateKey)}
              </Text>
              <Text className="text-white/40 text-sm mt-1">{dateKey}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
