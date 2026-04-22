import { create } from "zustand";
import * as Crypto from "expo-crypto";
import type { Todo } from "@/types";
import { saveTodos, loadTodos } from "@/utils/todo-storage";
import { enqueue } from "@/sync";

interface RemoteTodo {
  id: string;
  text: string;
  status: "open" | "done";
  vault_path: string | null;
  created_at: number;
  updated_at: number;
}

interface TodoState {
  todos: Todo[];
  hydrated: boolean;

  hydrate: () => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  mergeRemoteTodos: (remote: RemoteTodo[]) => void;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  hydrated: false,

  hydrate: () => {
    const todos = loadTodos();
    set({ todos, hydrated: true });
  },

  addTodo: (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newTodo: Todo = {
      id: Crypto.randomUUID(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
      completedAt: null,
    };

    const todos = [newTodo, ...get().todos];
    saveTodos(todos);
    set({ todos });

    enqueue("POST", "/todos", { text: newTodo.text, status: "open" });
  },

  toggleTodo: (id: string) => {
    const todos = get().todos.map((todo) =>
      todo.id === id
        ? {
            ...todo,
            completed: !todo.completed,
            completedAt: !todo.completed ? Date.now() : null,
          }
        : todo,
    );
    saveTodos(todos);
    set({ todos });

    const toggled = todos.find((t) => t.id === id);
    if (!toggled) return;
    enqueue("PATCH", `/todos/${id}`, {
      status: toggled.completed ? "done" : "open",
    });
  },

  deleteTodo: (id: string) => {
    const todos = get().todos.filter((todo) => todo.id !== id);
    saveTodos(todos);
    set({ todos });

    enqueue("DELETE", `/todos/${id}`);
  },

  mergeRemoteTodos: (remote: RemoteTodo[]) => {
    const local = get().todos;
    const localById = new Map(local.map((t) => [t.id, t]));
    const byVault = new Map(
      local
        .filter((t) => t.vaultPath)
        .map((t) => [t.vaultPath as string, t]),
    );

    const merged: Todo[] = [...local];
    for (const r of remote) {
      if (localById.has(r.id)) continue;
      if (r.vault_path && byVault.has(r.vault_path)) continue;
      merged.push({
        id: r.id,
        text: r.text,
        completed: r.status === "done",
        createdAt: r.created_at,
        completedAt: r.status === "done" ? r.updated_at : null,
        vaultPath: r.vault_path ?? undefined,
        remote: true,
      });
    }
    saveTodos(merged);
    set({ todos: merged });
  },
}));
