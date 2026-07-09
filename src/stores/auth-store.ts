import { create } from "zustand"
export interface AuthUser {
  id: string
  email: string | null
  name?: string | null
}

export interface AuthState {
  isAuthenticated: boolean
  user: AuthUser | null
  isLoading: boolean
  hydrate: () => void
  login: (email: string, password: string) => Promise<{ error: string | null }>
  signup: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => {
  let initialized = false

  async function loadSession() {
    const res = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })

    const payload = (await res.json()) as {
      status?: string
      error?: string
      data?: {
        isAuthenticated?: boolean
        user?: AuthUser | null
      } | null
    }

    if (!res.ok || payload.status !== "success") {
      throw new Error(payload.error ?? "Failed to load session")
    }

    return {
      isAuthenticated: payload.data?.isAuthenticated === true,
      user: payload.data?.user ?? null,
    }
  }

  async function postAuth(path: string, body?: Record<string, unknown>) {
    const res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })

    const payload = (await res.json()) as {
      status?: string
      error?: string
      data?: {
        isAuthenticated?: boolean
        user?: AuthUser | null
      } | null
    }

    if (!res.ok || payload.status !== "success") {
      return {
        error: payload.error ?? "Request failed",
        isAuthenticated: false,
        user: null,
      }
    }

    return {
      error: null,
      isAuthenticated: payload.data?.isAuthenticated === true,
      user: payload.data?.user ?? null,
    }
  }

  return {
    isAuthenticated: false,
    user: null,
    isLoading: true,

    hydrate: () => {
      if (initialized) return
      initialized = true

      loadSession().then((session) => {
        set({
          isAuthenticated: session.isAuthenticated,
          user: session.user,
          isLoading: false,
        })
      }).catch(() => {
        set({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        })
      })
    },

    login: async (email, password) => {
      const result = await postAuth("/api/auth/login", { email, password })
      if (!result.error) {
        set({
          isAuthenticated: result.isAuthenticated,
          user: result.user,
          isLoading: false,
        })
      }
      return { error: result.error }
    },

    signup: async (email, password) => {
      const result = await postAuth("/api/auth/signup", { email, password })
      if (!result.error) {
        set({
          isAuthenticated: result.isAuthenticated,
          user: result.user,
          isLoading: false,
        })
      }
      return { error: result.error }
    },

    signInWithGoogle: async () => {
      const siteUrl = window.location.origin
      const params = new URLSearchParams({
        siteUrl,
        next: window.location.pathname + window.location.search,
      })
      window.location.href = `/api/auth/google?${params.toString()}`
    },

    logout: async () => {
      const result = await postAuth("/api/auth/logout")
      if (!result.error) {
        set({ isAuthenticated: false, user: null, isLoading: false })
      }
    },
  }
})
