import { create } from "zustand";
import * as Crypto from "expo-crypto";
import type { Todo } from "@/types";
import { saveTodos, loadTodos } from "@/utils/todo-storage";
import { enqueue } from "@/sync";

interface TodoState {
  todos: Todo[];
  hydrated: boolean;

  hydrate: () => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;

  /** Merge todos fetched from Archive (via /todos) into local state without duplicating. */
  mergeRemoteTodos: (remote: RemoteTodo[]) => void;
}

interface RemoteTodo {
  id: string;
  text: string;
  status: "open" | "done";
  vault_path: string | null;
  created_at: number;
  updated_at: number;
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

    // Archive sync — enqueue; failure is recoverable (queue retries).
    enqueue(
      "POST",
      "/todos",
      {
        text: newTodo.text,
        status: "open",
      },
      newTodo.id,
    );
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
    // If the todo is bound to a remote id (same id because we reuse the UUID
    // on create), PATCH by that id. Remote-originated todos may have a
    // different id — we key sync via correlation, but this simple case
    // covers every locally-created todo.
    enqueue(
      "PATCH",
      `/todos/${id}`,
      { status: toggled.completed ? "done" : "open" },
      id,
    );
  },

  deleteTodo: (id: string) => {
    const todos = get().todos.filter((todo) => todo.id !== id);
    saveTodos(todos);
    set({ todos });

    enqueue("DELETE", `/todos/${id}`, undefined, id);
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
      // Same id — server knows this one.
      if (localById.has(r.id)) continue;
      // Vault-originated — pinned by vault_path.
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
