import { create } from "zustand";
import * as Crypto from "expo-crypto";
import type { Todo } from "@/types";
import { saveTodos, loadTodos } from "@/utils/todo-storage";

interface TodoState {
  todos: Todo[];
  hydrated: boolean;

  hydrate: () => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
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
  },

  deleteTodo: (id: string) => {
    const todos = get().todos.filter((todo) => todo.id !== id);
    saveTodos(todos);
    set({ todos });
  },
}));
