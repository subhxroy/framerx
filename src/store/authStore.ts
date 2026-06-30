import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

interface AuthStore {
  user: AuthUser | null
  loading: boolean
  error: string | null

  setUser: (user: AuthUser | null) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  clearError: () => set({ error: null }),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Supabase session bootstrap
// ─────────────────────────────────────────────────────────────────────────────

function supabaseUserToAuth(u: any): AuthUser {
  return {
    uid: u.id,
    email: u.email ?? null,
    displayName: u.user_metadata?.full_name ?? u.user_metadata?.name ?? u.email?.split('@')[0] ?? null,
    photoURL: u.user_metadata?.avatar_url ?? null,
  }
}

if (isSupabaseConfigured && supabase) {
  // Restore session from Supabase (handles refresh tokens automatically)
  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) {
      useAuthStore.getState().setUser(supabaseUserToAuth(data.session.user))
    } else {
      useAuthStore.getState().setLoading(false)
    }
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      useAuthStore.getState().setUser(supabaseUserToAuth(session.user))
    } else {
      useAuthStore.getState().setUser(null)
    }
  })
} else {
  // Local fallback — restore previously saved mock user
  try {
    const raw = localStorage.getItem('framer_auth_user')
    if (raw) {
      useAuthStore.getState().setUser(JSON.parse(raw))
    } else {
      useAuthStore.getState().setLoading(false)
    }
  } catch {
    useAuthStore.getState().setLoading(false)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth actions
// ─────────────────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<boolean> {
  useAuthStore.getState().setLoading(true)
  useAuthStore.getState().clearError()

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      useAuthStore.getState().setError(error.message)
      return false
    }
    return true
  }

  // Local mock
  await new Promise((r) => setTimeout(r, 400))
  const user: AuthUser = { uid: 'local_user', email, displayName: email.split('@')[0], photoURL: null }
  useAuthStore.getState().setUser(user)
  localStorage.setItem('framer_auth_user', JSON.stringify(user))
  return true
}

export async function signUp(email: string, password: string): Promise<boolean> {
  useAuthStore.getState().setLoading(true)
  useAuthStore.getState().clearError()

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      useAuthStore.getState().setError(error.message)
      return false
    }
    // signUp triggers onAuthStateChange when confirmed
    return true
  }

  await new Promise((r) => setTimeout(r, 400))
  const user: AuthUser = { uid: 'local_user', email, displayName: email.split('@')[0], photoURL: null }
  useAuthStore.getState().setUser(user)
  localStorage.setItem('framer_auth_user', JSON.stringify(user))
  return true
}

export async function signInWithGoogle(): Promise<boolean> {
  useAuthStore.getState().clearError()

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
    if (error) {
      useAuthStore.getState().setError(error.message)
      return false
    }
    return true
  }

  // Local mock
  const user: AuthUser = { uid: 'local_user', email: 'user@example.com', displayName: 'User', photoURL: null }
  useAuthStore.getState().setUser(user)
  localStorage.setItem('framer_auth_user', JSON.stringify(user))
  return true
}

export async function resetPassword(email: string): Promise<boolean> {
  useAuthStore.getState().clearError()

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    })
    if (error) {
      useAuthStore.getState().setError(error.message)
      return false
    }
    return true
  }

  await new Promise((r) => setTimeout(r, 400))
  return true
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut()
  } else {
    useAuthStore.getState().setUser(null)
    localStorage.removeItem('framer_auth_user')
  }
}
