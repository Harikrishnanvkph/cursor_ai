"use client"
import React, { createContext, useContext, useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react'
import { authApi, type AuthUser } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ wasNewUser: boolean; requiresEmailConfirmation?: boolean }>
  signOut: () => Promise<void>
  signInWithGoogle: () => void
  signInAsGuest: () => void
  refresh: () => Promise<void>
  upgradeToPro: () => Promise<boolean>
  downgradeToFree: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const setAuthCookie = (isAuthenticated: boolean) => {
  if (typeof document !== 'undefined') {
    if (isAuthenticated) {
      document.cookie = `is_authenticated=true; path=/; max-age=${15 * 24 * 60 * 60}; SameSite=Lax`
    } else {
      document.cookie = `is_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    }
  }
}

// Synchronously read the "was signed in" hint (client cookie + cached profile) so the very first
// client paint can already show the signed-in UI instead of waiting for the /auth/me round-trip.
function readCachedSession(): AuthUser | null {
  try {
    const hasCookie = document.cookie.includes('is_authenticated=true')
    const cachedUser = localStorage.getItem('cached_auth_user')
    if (hasCookie && cachedUser) {
      const parsed = JSON.parse(cachedUser) as AuthUser
      // Security: Never trust client-cached is_admin claim optimistically.
      // Wait for server authApi.me() to confirm before granting any admin status.
      return { ...parsed, is_admin: false }
    }
  } catch {}
  return null
}

// Persist every successful authentication the same way, wherever it came from (me / sign-in / guest).
// Previously only refresh() wrote `cached_auth_user`, so right after an email sign-in the next page
// load had no hint to render from and showed the signed-out UI until /auth/me answered.
function persistSession(user: AuthUser) {
  if (typeof window !== 'undefined') {
    try {
      if (user.id) localStorage.setItem('user-id', user.id)
      localStorage.setItem('cached_auth_user', JSON.stringify(user))
    } catch {}
  }
  setAuthCookie(true)
}

function clearPersistedSession() {
  setAuthCookie(false)
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('cached_auth_user')
      localStorage.removeItem('user-id')
    } catch {}
  }
}

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

// Back-off between retries when /auth/me fails for a transient reason (timeout, 5xx, cold start)
const ME_RETRY_DELAYS_MS = [600, 1800]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  // Must start as null/true so server HTML and the first client render match (no hydration mismatch).
  // The cached session is applied in a layout effect below, i.e. after hydration but BEFORE first paint.
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Bumped by every explicit auth action (sign-in / sign-out / guest). A /auth/me request that was
  // started before the bump is stale and must not overwrite the newer state.
  const authEpochRef = useRef(0)
  // Share one in-flight verification between mount, auth:refresh events, the OAuth success page, etc.
  const inFlightRefreshRef = useRef<{ promise: Promise<void>; epoch: number } | null>(null)

  const runRefresh = useCallback(async () => {
    const epoch = authEpochRef.current
    const isStale = () => epoch !== authEpochRef.current

    try {
      let res = await authApi.me()

      // Transient failure (network error, timeout, 5xx/429 - NOT an explicit 401): retry with back-off
      // instead of leaving a perfectly valid session looking signed-out until the next page load.
      for (const delay of ME_RETRY_DELAYS_MS) {
        if (!res.isNetworkError) break
        if (typeof navigator !== 'undefined' && navigator.onLine === false) break
        await sleep(delay)
        if (isStale()) return
        res = await authApi.me()
      }

      if (isStale()) return

      // Still failing after retries: DO NOT wipe the user session. Keep the optimistic session.
      if (res.isNetworkError) {
        console.warn('⚠️ Transient network/server error checking session — preserving active session.')
        return
      }

      // User verified successfully
      if (res.user) {
        setUser(res.user)
        persistSession(res.user)
        return
      }

      // Explicit authentication failure (HTTP 401 confirmed)
      if (res.isAuthError) {
        setUser(null)
        clearPersistedSession()
      }
    } catch (error: any) {
      console.warn('Unexpected error during refresh (preserving active session):', error)
    } finally {
      if (!isStale()) setLoading(false)
    }
  }, [])

  const refresh = useCallback((): Promise<void> => {
    const current = inFlightRefreshRef.current
    // Reuse the running request unless an explicit auth action (sign-in/out) happened since it started:
    // in that case its answer is already obsolete and we need a fresh one.
    if (current && current.epoch === authEpochRef.current) return current.promise

    const entry = { epoch: authEpochRef.current, promise: undefined as unknown as Promise<void> }
    entry.promise = runRefresh().finally(() => {
      if (inFlightRefreshRef.current === entry) inFlightRefreshRef.current = null
    })
    inFlightRefreshRef.current = entry
    return entry.promise
  }, [runRefresh])

  // Apply the cached session before the browser paints so a returning user never sees a
  // "Sign in / Try for free" flash while /auth/me is still in flight.
  useLayoutEffect(() => {
    const cached = readCachedSession()
    if (cached) {
      setUser(cached)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    // Quota-changing actions (create/delete chart, AI generation) fire `auth:refresh` in bursts;
    // coalesce them so we don't run the (multi-query) /auth/me endpoint several times in a row.
    let timer: ReturnType<typeof setTimeout> | null = null
    const handleAuthRefresh = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        refresh()
      }, 400)
    }
    window.addEventListener('auth:refresh', handleAuthRefresh)
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('auth:refresh', handleAuthRefresh)
    }
  }, [refresh])

  // Cross-tab synchronization: keep login/logout in sync across open tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cached_auth_user') {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue) as AuthUser
            setUser({
              ...parsed,
              is_admin: false
            })
          } catch {}
        } else {
          setUser(null)
          setAuthCookie(false)
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      const protectedPaths = ['/board', '/landing', '/editor', '/admin']
      const isProtected = protectedPaths.some(p => window.location.pathname.startsWith(p))
      
      if (isProtected) {
        const hasCookie = document.cookie.includes('is_authenticated=true')
        // Force a page reload if restored from back-forward cache after logging out
        if (event.persisted && !hasCookie) {
          window.location.reload()
        }
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => {
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    try {
      const res = await authApi.signIn({ email, password })

      // Check if this is a network failure response
      if (!res) {
        // Check if it's a network error vs server error
        if (typeof window !== 'undefined' && !navigator.onLine) {
          toast.error('No internet connection. Please check your network and try again.')
        } else {
          toast.error('Server is currently unavailable. Please try again later.')
        }
        return false
      }

      // A sign-in supersedes any /auth/me request still in flight from before it (e.g. the mount-time
      // check that returned 401 because the user had not signed in yet) - otherwise that late 401
      // would wipe the brand-new session.
      authEpochRef.current++
      setUser(res.user)

      // Persist user id + cached profile + auth cookie hint (so the next page load renders signed-in at once)
      persistSession(res.user)

      // Handle redirect after successful sign-in
      if (typeof window !== 'undefined') {
        // Find if we need to redirect admin vs normal user
        const redirectPath = sessionStorage.getItem('redirectAfterSignIn')

        if (res.user?.is_admin) {
           router.replace('/admin')
        } else if (redirectPath) {
           console.log(`🔄 SignIn successful, redirecting to: ${redirectPath}`)
           sessionStorage.removeItem('redirectAfterSignIn')
           router.replace(redirectPath)
        } else {
           // Default redirect if no stored path exists for normal users
           router.replace('/board')
        }
      }

      return true // Success
    } catch (e: any) {

      const m = String(e?.message || '').toLowerCase()

      // Handle other errors (not network failures)
      if (m.includes('request timed out')) {
        toast.error('Request timed out. Please try again.')
      } else if (m.includes('invalid email or password') || m.includes('invalid login')) {
        toast.error('Incorrect email or password. Please try again.')
      } else if (m.includes('invalid email format')) {
        toast.error('Invalid or unregistered email address')
      } else if (m.includes('password is required')) {
        toast.error('Password is required')
      } else if (m.includes('email is required')) {
        toast.error('Email is required')
      } else if (m.includes('too many') || m.includes('rate limit')) {
        toast.error('Too many attempts. Please wait and try again.')
      } else if (m.includes('request failed')) {
        toast.error('Authentication service is temporarily unavailable. Please try again.')
      } else {
        console.log('🔍 No specific error match found, showing generic error')
        toast.error('Failed to sign in')
      }
      // Don't re-throw the error - handle it gracefully
      console.error('Sign in error:', e)

      return false // Failure
    } finally {
      setLoading(false)
    }
  }, [])

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ wasNewUser: boolean; requiresEmailConfirmation?: boolean }> => {
    setLoading(true)
    try {
      const res = await authApi.signUp({ email, password, fullName })

      // Check if this is a network failure response
      if (!res) {
        // Check if it's a network error vs server error
        if (typeof window !== 'undefined' && !navigator.onLine) {
          toast.error('No internet connection. Please check your network and try again.')
        } else {
          toast.error('Server is currently unavailable. Please try again later.')
        }
        return { wasNewUser: false, requiresEmailConfirmation: false }
      }

      if (res.wasNewUser && res.requiresEmailConfirmation) {
        toast.info('Verification email sent. Please confirm to sign in.')
      } else if (!res.wasNewUser) {
        toast.error('Email is already registered. Try signing in instead.')
      }
      authEpochRef.current++
      await refresh()

      // User ID will be stored in refresh() method
      return { wasNewUser: Boolean(res.wasNewUser), requiresEmailConfirmation: res.requiresEmailConfirmation }
    } catch (e: any) {
      const m = String(e?.message || '')

      // Handle other errors (not network failures)
      if (m.toLowerCase().includes('request timed out')) {
        toast.error('Request timed out. Please try again.')
      } else if (m.toLowerCase().includes('already')) {
        toast.error('Email is already registered. Try signing in instead.')
      } else if (m.toLowerCase().includes('password')) {
        toast.error('Password does not meet requirements')
      } else if (m.toLowerCase().includes('full name')) {
        toast.error('Full name is required')
      } else if (m.toLowerCase().includes('email')) {
        toast.error('Please enter a valid email address')
      } else if (m.toLowerCase().includes('request failed')) {
        toast.error('Authentication service is temporarily unavailable. Please try again.')
      } else {
        toast.error('Failed to sign up')
      }
      // Don't re-throw the error - handle it gracefully
      console.error('Sign up error:', e)

      // Return a default value when there's an error
      return { wasNewUser: false, requiresEmailConfirmation: false }
    } finally {
      setLoading(false)
    }
  }, [refresh])

  const signOut = useCallback(async () => {
    setLoading(true)

    // 1) Invalidate everything local FIRST and synchronously. From this instant the UI, the
    //    middleware cookie hint and any in-flight /auth/me are already "signed out" - the user no longer
    //    has to wait on the network for that to take effect.
    const userId = typeof window !== 'undefined' ? (localStorage.getItem('user-id') || user?.id || null) : null
    authEpochRef.current++ // a /auth/me started before now must not resurrect the session
    setUser(null)
    clearPersistedSession()
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_user')
      sessionStorage.removeItem('redirectAfterSignIn')
      sessionStorage.setItem('logged_out_from_oauth', 'true')
    }

    // 2) Revoke the server session (httpOnly cookies can only be cleared by the server) and evict the
    //    user's local/IndexedDB data IN PARALLEL. These used to run one after another, with the server
    //    round-trip (2 DB/Supabase calls) blocking the cleanup and the redirect.
    const revokeOnServer = async () => {
      const withTimeout = <T,>(p: Promise<T>, ms: number) =>
        Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))])
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await withTimeout(authApi.signOut(), 4000)
          if (res) return true
        } catch {}
        // One quick retry: if the cookie is not cleared, the /signin page would find the user still
        // signed in and bounce them straight back.
        await sleep(300)
      }
      return false
    }

    const evictLocalData = async () => {
      if (!userId) return
      try {
        const { clearAllUserSessionData } = await import('@/lib/storage-utils')
        // Synchronous localStorage cleanup happens immediately inside; the IndexedDB part can hang
        // indefinitely (e.g. an open blocked by another tab), so never let it hold up the redirect.
        await Promise.race([clearAllUserSessionData(userId), sleep(2500)])
      } catch (err) {
        console.warn('Failed to clear user storage:', err)
      }
    }

    const [serverResult] = await Promise.allSettled([revokeOnServer(), evictLocalData()])
    if (serverResult.status !== 'fulfilled' || !serverResult.value) {
      console.warn('Server unavailable during sign out, but user cleared locally')
    }

    // Full navigation (not router) to reset the in-memory heap and every store
    if (typeof window !== 'undefined') {
      window.location.replace('/signin')
      return
    }
    setLoading(false)
  }, [user?.id])

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true)
      const url = await authApi.googleUrl()

      if (!url) {
        if (typeof window !== 'undefined' && !navigator.onLine) {
          toast.error('No internet connection. Please check your network and try again.')
        } else {
          toast.error('Server is currently unavailable. Please try again later.')
        }
        setLoading(false)
        return
      }

      // Same tab Google OAuth redirect (push to preserve /signin in history)
      if (typeof window !== 'undefined') {
        window.location.href = url
      }
    } catch (error: any) {
      console.error('Failed to get Google OAuth URL:', error)
      setLoading(false)
      toast.error('Failed to start Google sign-in.')
    }
  }, [])

  // Guest sign-in — temporary, calls real server endpoint for full functionality
  const signInAsGuest = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authApi.guestSignIn()

      if (!res) {
        if (typeof window !== 'undefined' && !navigator.onLine) {
          toast.error('No internet connection. Please check your network and try again.')
        } else {
          toast.error('Server is currently unavailable. Please try again later.')
        }
        return
      }

      authEpochRef.current++
      setUser(res.user)
      persistSession(res.user)

      router.replace('/')
    } catch (e: any) {
      console.error('Guest sign-in error:', e)
      toast.error('Failed to sign in as guest. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [router])

  const upgradeToPro = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authApi.upgradeToPro()
      if (res && res.success) {
        toast.success("Successfully upgraded to Pro! You now have 50 monthly AI credits and 30 cloud saves.")
        await refresh()
        return true
      }
      toast.error(res?.message || "Failed to upgrade subscription")
      return false
    } catch (err: any) {
      toast.error(err.message || "Failed to upgrade subscription")
      return false
    } finally {
      setLoading(false)
    }
  }, [refresh])

  const downgradeToFree = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authApi.downgradeToFree()
      if (res && res.success) {
        toast.info("Subscription set to Free plan.")
        // Warn if user now has more charts than the Free plan allows
        if (res.subscription?.over_limit_charts) {
          toast.warning(
            `You have ${res.subscription.over_limit_charts} more chart(s) than your Free plan allows (max 10). ` +
            `Your existing charts are safe, but you won't be able to save new ones until you delete some.`,
            { duration: 8000 }
          )
        }
        await refresh()
        return true
      }
      return false
    } catch (err: any) {
      toast.error(err.message || "Failed to change subscription")
      return false
    } finally {
      setLoading(false)
    }
  }, [refresh])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInWithGoogle, signInAsGuest, refresh, upgradeToPro, downgradeToFree }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


