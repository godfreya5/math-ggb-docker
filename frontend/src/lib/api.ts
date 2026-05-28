import type { TokenResponse, Session, Message, ChatResponse } from "@/types"

const BASE = "/api"

let _getToken: () => string | null = () => localStorage.getItem("token")

export function setTokenGetter(fn: () => string | null) {
  _getToken = fn
}

function token(): string | null {
  return _getToken() || localStorage.getItem("token")
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const t = token()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (t) {
    headers["Authorization"] = `Bearer ${t}`
  }
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }
  const res = await fetch(`${BASE}${url}`, { ...options, headers })
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
      throw new Error("登录已过期，请重新登录")
    }
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const auth = {
  register: (data: { username: string; email: string; password: string }) =>
    request<TokenResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
}

export const admin = {
  getLLMConfig: () => request<{ provider: string; api_key: string; base_url: string; model: string }>("/admin/llm-config"),

  updateLLMConfig: (data: { provider?: string; api_key?: string; base_url?: string; model?: string }) =>
    request<{ provider: string; api_key: string; base_url: string; model: string }>("/admin/llm-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  resetLLMConfig: () =>
    request<{ provider: string; api_key: string; base_url: string; model: string }>("/admin/llm-config", {
      method: "DELETE",
    }),
}

export const sessions = {
  create: (title?: string) =>
    request<Session>("/sessions", { method: "POST", body: JSON.stringify({ title }) }),

  list: () => request<Session[]>("/sessions"),

  get: (id: string) => request<Session>(`/sessions/${id}`),

  delete: (id: string) => request<void>(`/sessions/${id}`, { method: "DELETE" }),

  upload: (id: string, file: File) => {
    const fd = new FormData()
    fd.append("file", file)
    return request<{ image_path: string; filename: string }>(`/sessions/${id}/upload`, {
      method: "POST",
      body: fd,
    })
  },

  chat: (id: string, message: string) =>
    request<ChatResponse>(`/sessions/${id}/chat`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  messages: (id: string) => request<Message[]>(`/sessions/${id}/messages`),
}
