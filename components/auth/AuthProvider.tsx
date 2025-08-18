"use client"
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi, type AuthUser } from '@/lib/auth-client'
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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    console.log('hellow from refresh')
    try {
      const res = await authApi.me()
      setUser(res.user)
      
      // Don't handle redirects in refresh - let the signIn method handle it
      // This prevents loops when the user is already authenticated
    } catch (error: any) {
      // This shouldn't happen now since authApi.me() handles network errors
      console.warn('Unexpected error during refresh:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
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
      toast.success('Signed in')
      
      // Handle redirect after successful sign-in
      if (typeof window !== 'undefined') {
        const redirectPath = sessionStorage.getItem('redirectAfterSignIn')
        if (redirectPath) {
          console.log(`🔄 SignIn successful, redirecting to: ${redirectPath}`)
          sessionStorage.removeItem('redirectAfterSignIn')
          // Use setTimeout to ensure the current operation completes
          setTimeout(() => {
            window.location.href = redirectPath
          }, 100)
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
      const res = await authApi.signOut()
      
      // Always clear the user locally regardless of server response
      setUser(null)
      // Clear any local caches that could rehydrate user
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('auth_user')
          sessionStorage.removeItem('redirectAfterSignIn')
        } catch {}
      }
      
      // Only show error if there was an actual problem (not network failure)
      if (!res) {
        console.warn('Server unavailable during sign out, but user cleared locally')
        // Don't show error toast since sign out actually worked
      }
      // Soft redirect to home to ensure a clean post-logout view
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          // If you're on a protected page, this will take you out cleanly
          window.location.href = '/'
        }, 50)
      }
    } catch (error: any) {
      console.error('Sign out error:', error)
      
      // Still clear the user locally even if server call fails
      setUser(null)
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('auth_user')
          sessionStorage.removeItem('redirectAfterSignIn')
        } catch {}
      }
      
      // Only show error for actual failures, not network issues
      if (!error.message?.includes('network') && !error.message?.includes('unavailable')) {
        toast.error('Sign out completed, but there was an issue with the server.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true)
      const url = await authApi.googleUrl()
      
      // Check if this is a network failure response
      if (!url) {
        // Check if it's a network error vs server error
        if (typeof window !== 'undefined' && !navigator.onLine) {
          toast.error('No internet connection. Please check your network and try again.')
        } else {
          toast.error('Server is currently unavailable. Please try again later.')
        }
        return
      }
      
      window.location.href = url
    } catch (error: any) {
      console.error('Failed to get Google OAuth URL:', error)
      
      // Handle other errors (not network failures)
      const errorMessage = error?.message || 'Unknown error occurred'
      
      if (errorMessage.includes('Request timed out')) {
        toast.error('Request timed out. Please try again.')
      } else if (errorMessage.includes('Request failed')) {
        toast.error('Authentication service is temporarily unavailable. Please try again.')
      } else {
        toast.error('Failed to start Google OAuth. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


