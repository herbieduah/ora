// Mutating calls should flow through the sync queue so they survive offline;
// direct use is limited to GETs and the queue's own flush path.
import Config from "@/config";
import { getBearer } from "@/services/bearer-storage";
import { devError, devLog } from "@/utils/logger";

export interface ArchiveError extends Error {
  status?: number;
  detail?: string;
}

function buildUrl(path: string): string {
  const base = Config.archiveBaseUrl.replace(/\/$/, "");
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

async function makeError(resp: Response, detail?: string): Promise<ArchiveError> {
  const err = new Error(
    `Archive ${resp.status} ${resp.statusText}${detail ? `: ${detail}` : ""}`,
  ) as ArchiveError;
  err.status = resp.status;
  err.detail = detail;
  return err;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Abort signal for bail-out when a component unmounts mid-flight. */
  signal?: AbortSignal;
  /** Skip bearer attachment — only used by health probes. */
  anonymous?: boolean;
}

export async function request<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, query, signal, anonymous } = opts;

  let url = buildUrl(path);
  if (query) {
    const entries = Object.entries(query).filter(
      ([, v]) => v !== undefined && v !== null,
    );
    if (entries.length) {
      const qs = entries
        .map(
          ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
        )
        .join("&");
      url += (url.includes("?") ? "&" : "?") + qs;
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (!anonymous) {
    const token = await getBearer();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const init: RequestInit = { method, headers, signal };
  if (body !== undefined) {
    init.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  try {
    const resp = await fetch(url, init);
    if (!resp.ok) {
      let detail: string | undefined;
      try {
        const payload = (await resp.json()) as { detail?: string };
        detail = payload?.detail;
      } catch {
        try {
          detail = await resp.text();
        } catch {
          /* ignore */
        }
      }
      throw await makeError(resp, detail);
    }
    // Tolerate empty/204 responses
    const text = await resp.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    devError("archive-client", `${method} ${path}`, err);
    throw err;
  }
}

export interface ApiLoop {
  id: string;
  photo_uri: string | null;
  photo_filename: string | null;
  start_time: number;
  end_time: number | null;
  date_key: string;
  label: string | null;
  notes: string | null;
  description: string | null;
  tags?: string[];
  created_by: string | null;
  updated_at: number;
}

export interface ApiTodo {
  id: string;
  text: string;
  status: "open" | "done";
  due_at: number | null;
  vault_path: string | null;
  loop_id: string | null;
  created_at: number;
  updated_at: number;
}

export const loops = {
  list: (query?: { from_ts?: number; to_ts?: number; limit?: number }) =>
    request<{ loops: ApiLoop[] }>("/loops", { query }),
  create: (body: {
    photo_uri?: string;
    photo_filename?: string;
    start_time?: number;
    label?: string;
  }) => request<ApiLoop>("/loops", { method: "POST", body }),
  update: (
    id: string,
    body: Partial<{
      end_time: number;
      label: string;
      notes: string;
      description: string;
      tags: string[];
      photo_uri: string;
      photo_filename: string;
    }>,
  ) => request<ApiLoop>(`/loops/${id}`, { method: "PATCH", body }),
  remove: (id: string) =>
    request<{ ok: true; id: string }>(`/loops/${id}`, { method: "DELETE" }),
};

export const todos = {
  list: (query?: { status?: string; limit?: number; sync_vault?: boolean }) =>
    request<{ todos: ApiTodo[] }>("/todos", { query }),
  create: (body: {
    text: string;
    due_at?: number;
    vault_path?: string;
    loop_id?: string;
    status?: "open" | "done";
  }) => request<ApiTodo>("/todos", { method: "POST", body }),
  update: (
    id: string,
    body: Partial<{
      text: string;
      status: "open" | "done";
      due_at: number;
      loop_id: string;
    }>,
  ) => request<ApiTodo>(`/todos/${id}`, { method: "PATCH", body }),
  remove: (id: string) =>
    request<{ ok: true; id: string }>(`/todos/${id}`, { method: "DELETE" }),
};

export const devices = {
  register: (body: { expo_push_token: string; device_name?: string }) =>
    request<{
      id: string;
      expo_push_token: string;
      device_name: string | null;
      registered_at: number;
    }>("/devices", { method: "POST", body }),
  remove: (expoPushToken: string) =>
    request<{ ok: true; token: string }>(
      `/devices/${encodeURIComponent(expoPushToken)}`,
      { method: "DELETE" },
    ),
};

export const memory = {
  search: (q: string, limit = 5, signal?: AbortSignal) =>
    request<{
      query: string;
      result: {
        results: {
          id: string;
          memory: string;
          score?: number;
          metadata?: { category?: string };
          created_at?: string;
        }[];
      };
    }>("/memory/search", { query: { q, limit }, signal }),
  all: (limit = 10) =>
    request<{
      result: {
        results: {
          id: string;
          memory: string;
          metadata?: { category?: string };
          created_at?: string;
        }[];
      };
    }>("/memory/all", { query: { limit } }),
};

export const reflect = {
  questions: (body: { recent_memory_ids?: string[]; context?: string }) =>
    request<{
      questions: {
        text: string;
        type: "text" | "choice";
        choices?: string[];
      }[];
      memories_considered: string[];
      model: string;
    }>("/reflect", { method: "POST", body }),
  answer: (body: { question: string; answer: string; category?: string }) =>
    request<{ ok: true; job_id: string }>("/reflect/answer", {
      method: "POST",
      body,
    }),
};

export const transcribe = {
  upload: (form: FormData) =>
    request<{
      ok: boolean;
      text: string;
      duration_s: number;
      provider?: string;
      vault_path?: string;
      archive_job_id?: string;
      detail?: string;
    }>("/transcribe", { method: "POST", body: form }),
};

export async function health(): Promise<boolean> {
  try {
    const resp = await fetch(buildUrl("/health"), { method: "GET" });
    return resp.ok;
  } catch {
    return false;
  }
}

export function log(tag: string, ...args: unknown[]): void {
  devLog(`archive-client:${tag}`, ...args);
}
