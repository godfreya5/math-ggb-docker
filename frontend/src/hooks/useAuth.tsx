import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "@/types"
import { auth as authApi, setTokenGetter } from "@/lib/api"

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthState | null>(null)

function safeAtob(b64: string): string {
  try {
    // Handle base64url (JWT format): replace - with +, _ with /, add padding
    const base64 = b64.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=")
    return atob(padded)
  } catch {
    throw new Error("Invalid base64")
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"))
  const [loading] = useState(false)

  // Register token getter so api.ts uses React state, not localStorage directly
  useEffect(() => {
    setTokenGetter(() => token)
  }, [token])

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(safeAtob(token.split(".")[1]))
        setUser({ id: payload.sub, username: "", email: "", created_at: "" } as User)
      } catch { logout() }
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    localStorage.setItem("token", res.access_token)
    setToken(res.access_token)
    setUser(res.user)
  }

  const register = async (username: string, email: string, password: string) => {
    const res = await authApi.register({ username, email, password })
    localStorage.setItem("token", res.access_token)
    setToken(res.access_token)
    setUser(res.user)
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
