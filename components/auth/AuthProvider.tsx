"use client"
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const setAuthCookie = (isAuthenticated: boolean, isAdmin?: boolean) => {
  if (typeof document !== 'undefined') {
    if (isAuthenticated) {
      document.cookie = `is_authenticated=true; path=/; max-age=${15 * 24 * 60 * 60}; SameSite=Lax`
      if (isAdmin) {
        document.cookie = `is_admin=true; path=/; max-age=${15 * 24 * 60 * 60}; SameSite=Lax`
      } else {
        document.cookie = `is_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
      }
    } else {
      document.cookie = `is_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
      document.cookie = `is_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  // Optimistic initialization: if we have a cached user in localStorage + auth cookie,
  // skip the loading screen and verify in the background
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await authApi.me()
      setUser(res.user)

      // Cache the user for optimistic loading on next page load
      if (typeof window !== 'undefined') {
        if (res.user?.id) {
          localStorage.setItem('user-id', res.user.id)
          localStorage.setItem('cached_auth_user', JSON.stringify(res.user))
        } else {
          localStorage.removeItem('cached_auth_user')
        }
      }
      setAuthCookie(!!res.user, res.user?.is_admin)
    } catch (error: any) {
      console.warn('Unexpected error during refresh:', error)
      setUser(null)
      setAuthCookie(false)
      localStorage.removeItem('cached_auth_user')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    try {
      const hasCookie = document.cookie.includes('is_authenticated=true')
      const cachedUser = localStorage.getItem('cached_auth_user')
      if (hasCookie && cachedUser) {
        setUser(JSON.parse(cachedUser) as AuthUser)
        setLoading(false)
      }
    } catch {}
    refresh()
  }, [refresh])

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

      setUser(res.user)

      // Store user ID for user-specific localStorage keys
      if (typeof window !== 'undefined' && res.user?.id) {
        localStorage.setItem('user-id', res.user.id)
      }
      setAuthCookie(true, res.user?.is_admin)

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
           router.replace('/')
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
    try {
      // Get the userId before we clear state
      const userId = typeof window !== 'undefined' ? localStorage.getItem('user-id') : null
      const res = await authApi.signOut()

      // Always clear the user locally regardless of server response
      setUser(null)
      setAuthCookie(false)

      if (typeof window !== 'undefined') {
        localStorage.removeItem('cached_auth_user')
        localStorage.removeItem('user-id')
        sessionStorage.removeItem('auth_user')
        sessionStorage.removeItem('redirectAfterSignIn')
        sessionStorage.setItem('logged_out_from_oauth', 'true')

        // Completely evict all user local storage and IndexedDB keys
        if (userId) {
          try {
            const { clearAllUserSessionData } = await import('@/lib/storage-utils')
            await clearAllUserSessionData(userId)
          } catch (err) {
            console.warn('Failed to clear user storage:', err)
          }
        }
      }

      // Only show error if there was an actual problem (not network failure)
      if (!res) {
        console.warn('Server unavailable during sign out, but user cleared locally')
      }

      // Immediate redirect to sign-in page to secure session and reset memory heap
      if (typeof window !== 'undefined') {
        window.location.replace('/signin')
        return
      }
    } catch (error: any) {
      console.error('Sign out error:', error)

      // Still clear the user locally even if server call fails
      setUser(null)
      setAuthCookie(false)

      if (typeof window !== 'undefined') {
        const userId = localStorage.getItem('user-id')
        localStorage.removeItem('cached_auth_user')
        localStorage.removeItem('user-id')
        sessionStorage.removeItem('auth_user')
        sessionStorage.removeItem('redirectAfterSignIn')
        sessionStorage.setItem('logged_out_from_oauth', 'true')

        if (userId) {
          try {
            const { clearAllUserSessionData } = await import('@/lib/storage-utils')
            await clearAllUserSessionData(userId)
          } catch (err) {
            console.warn('Failed to clear user storage on error:', err)
          }
        }
      }

      // Only show error for actual failures, not network issues
      if (!error.message?.includes('network') && !error.message?.includes('unavailable')) {
        toast.error('Sign out completed, but there was an issue with the server.')
      }

      if (typeof window !== 'undefined') {
        window.location.replace('/signin')
        return
      }
    } finally {
      if (typeof window === 'undefined') {
        setLoading(false)
      }
    }
  }, [])

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

      setUser(res.user)

      if (typeof window !== 'undefined' && res.user?.id) {
        localStorage.setItem('user-id', res.user.id)
      }
      setAuthCookie(true, res.user?.is_admin)

      router.replace('/')
    } catch (e: any) {
      console.error('Guest sign-in error:', e)
      toast.error('Failed to sign in as guest. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInWithGoogle, signInAsGuest, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


