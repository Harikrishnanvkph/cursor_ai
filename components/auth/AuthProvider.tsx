"use client"
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi, type AuthUser } from '@/lib/auth-client'
import { toast } from 'sonner'

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
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
    try {
      const res = await authApi.me()
      setUser(res.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const res = await authApi.signIn({ email, password })
      setUser(res.user)
      toast.success('Signed in')
    } catch (e: any) {
      const m = String(e?.message || '').toLowerCase()
      if (m.includes('invalid email or password') || m.includes('invalid login')) {
        toast.error('Incorrect email or password. Please try again.')
      } else if (m.includes('invalid email format')) {
        toast.error('Invalid or unregistered email address')
      } else if (m.includes('password is required')) {
        toast.error('Password is required')
      } else if (m.includes('email is required')) {
        toast.error('Email is required')
      } else if (m.includes('too many') || m.includes('rate limit')) {
        toast.error('Too many attempts. Please wait and try again.')
      } else {
        toast.error('Failed to sign in')
      }
      throw e
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
      if (res.wasNewUser && res.requiresEmailConfirmation) {
        toast.info('Verification email sent. Please confirm to sign in.')
      } else if (!res.wasNewUser) {
        toast.error('Email is already registered. Try signing in instead.')
      }
      await refresh()
      return { wasNewUser: Boolean(res.wasNewUser), requiresEmailConfirmation: res.requiresEmailConfirmation }
    } catch (e: any) {
      const m = String(e?.message || '')
      if (m.toLowerCase().includes('already')) {
        toast.error('Email is already registered. Try signing in instead.')
      } else if (m.toLowerCase().includes('password')) {
        toast.error('Password does not meet requirements')
      } else if (m.toLowerCase().includes('full name')) {
        toast.error('Full name is required')
      } else if (m.toLowerCase().includes('email')) {
        toast.error('Please enter a valid email address')
      } else {
        toast.error('Failed to sign up')
      }
      throw e
    } finally {
      setLoading(false)
    }
  }, [refresh])

  const signOut = useCallback(async () => {
    setLoading(true)
    try {
      await authApi.signOut()
      setUser(null)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true)
      const url = await authApi.googleUrl()
      window.location.href = url
    } catch (error) {
      console.error('Failed to get Google OAuth URL:', error)
      toast.error('Failed to start Google OAuth. Please try again.')
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


