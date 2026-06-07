import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { env, isSupabaseAuthConfigured } from '../config/env'
import { getSupabase } from '../lib/supabaseClient'
import { AUTH_RETURN_KEY, type UserProfile } from '../types/auth'
import { isUsernameComplete, normalizeUsername, validateUsername } from '../utils/username'

const MOCK_AUTH_KEY = 'pmo-mock-auth'

interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  needsUsername: boolean
  signInWithGoogle: (returnPath?: string) => Promise<void>
  signOut: () => Promise<void>
  setUsername: (username: string) => Promise<{ error?: string }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapProfileRow(row: {
  id: string
  email: string
  username: string | null
  avatar_url: string | null
}): UserProfile {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    avatarUrl: row.avatar_url,
  }
}

function readMockUser(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(MOCK_AUTH_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserProfile
  } catch {
    return null
  }
}

function writeMockUser(user: UserProfile | null) {
  if (!user) {
    sessionStorage.removeItem(MOCK_AUTH_KEY)
    return
  }
  sessionStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(user))
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase.from('profiles').select('id, email, username, avatar_url').eq('id', userId).maybeSingle()
  if (error || !data) return null
  return mapProfileRow(data)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setUser(readMockUser())
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      setUser(null)
      return
    }
    const profile = await fetchProfile(session.user.id)
    if (profile) {
      setUser(profile)
      return
    }
    setUser({
      id: session.user.id,
      email: session.user.email ?? '',
      username: null,
      avatarUrl:
        (session.user.user_metadata?.avatar_url as string | undefined) ??
        (session.user.user_metadata?.picture as string | undefined) ??
        null,
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      if (!isSupabaseAuthConfigured()) {
        if (!cancelled) {
          setUser(readMockUser())
          setLoading(false)
        }
        return
      }

      const supabase = getSupabase()!
      await refreshProfile()
      if (!cancelled) setLoading(false)

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (cancelled) return
        if (!session?.user) {
          setUser(null)
          return
        }
        await refreshProfile()
      })

      return () => {
        subscription.unsubscribe()
      }
    }

    const cleanupPromise = init()
    return () => {
      cancelled = true
      void cleanupPromise
    }
  }, [refreshProfile])

  const signInWithGoogle = useCallback(async (returnPath?: string) => {
    if (returnPath) {
      sessionStorage.setItem(AUTH_RETURN_KEY, returnPath)
    }

    if (!isSupabaseAuthConfigured()) {
      const mockUser: UserProfile = {
        id: `mock-user-${Date.now()}`,
        email: 'demo@putmeon.local',
        username: null,
        avatarUrl: null,
      }
      writeMockUser(mockUser)
      setUser(mockUser)
      return
    }

    const supabase = getSupabase()!
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${env.appUrl.replace(/\/$/, '')}/auth/callback`,
      },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    writeMockUser(null)
    setUser(null)
    const supabase = getSupabase()
    if (supabase) await supabase.auth.signOut()
  }, [])

  const setUsername = useCallback(
    async (input: string): Promise<{ error?: string }> => {
      const validationError = validateUsername(input)
      if (validationError) return { error: validationError }

      const username = normalizeUsername(input)

      if (!isSupabaseAuthConfigured()) {
        if (!user) return { error: 'Not signed in.' }
        const next = { ...user, username }
        writeMockUser(next)
        setUser(next)
        return {}
      }

      const supabase = getSupabase()!
      const { data, error } = await supabase.rpc('set_profile_username', { new_username: username })
      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          return { error: 'That username is already taken.' }
        }
        if (error.message.includes('Invalid username')) {
          return { error: 'That username is not allowed.' }
        }
        if (error.message.includes('already set')) {
          return { error: 'Username is already set on your account.' }
        }
        return { error: error.message }
      }

      if (data) {
        setUser(mapProfileRow(data as { id: string; email: string; username: string | null; avatar_url: string | null }))
      } else {
        await refreshProfile()
      }
      return {}
    },
    [refreshProfile, user]
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      needsUsername: Boolean(user && !isUsernameComplete(user.username)),
      signInWithGoogle,
      signOut,
      setUsername,
      refreshProfile,
    }),
    [user, loading, signInWithGoogle, signOut, setUsername, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
