import { createMMKV, type MMKV } from "react-native-mmkv";

export const storage: MMKV = createMMKV({
  id: "ora-storage",
});
