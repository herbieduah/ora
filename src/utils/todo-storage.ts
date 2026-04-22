import { storage } from "@/store/storage/mmkv-storage";
import { logErrorVoid } from "@/utils/log-error";
import type { Todo } from "@/types";

const TODOS_KEY = "ora:todos";

export function saveTodos(todos: Todo[]): void {
  try {
    storage.set(TODOS_KEY, JSON.stringify(todos));
  } catch (error) {
    logErrorVoid("saveTodos", error);
  }
}

export function loadTodos(): Todo[] {
  try {
    const raw = storage.getString(TODOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    logErrorVoid("loadTodos", error);
    return [];
  }
}
