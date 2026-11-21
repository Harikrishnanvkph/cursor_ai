"use client"

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthPageShell, AuthCardFrame, AuthLoadingCard } from '@/components/auth/AuthPageShell'
import { useAuth } from '@/components/auth/AuthProvider'
import { authApi } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

function getSafeRedirectPath(raw: string | null): string {
  if (
    raw &&
    raw.startsWith('/') &&
    !raw.startsWith('//') &&
    !raw.startsWith('/signin') &&
    !raw.startsWith('/signup') &&
    !raw.startsWith('/admin/signin')
  ) {
    return raw
  }
  return '/board'
}

function ConfirmEmailContent() {
  const searchParams = useSearchParams()
  const { user, loading, refresh } = useAuth()
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState('Unable to verify your email link.')
  const hasAttemptedRef = useRef(false)

  // If already signed in (e.g., verification succeeded), redirect to workspace
  useEffect(() => {
    if (!loading && user) {
      const redirectPath = getSafeRedirectPath(sessionStorage.getItem('redirectAfterSignIn'))
      sessionStorage.removeItem('redirectAfterSignIn')
      window.location.replace(redirectPath)
    }
  }, [user, loading])

  useEffect(() => {
    if (hasAttemptedRef.current) return

    const hashParams =
      typeof window !== 'undefined' && window.location.hash
        ? new URLSearchParams(window.location.hash.replace(/^#/, ''))
        : new URLSearchParams()

    const errDesc =
      hashParams.get('error_description') ||
      searchParams.get('error_description') ||
      hashParams.get('error') ||
      searchParams.get('error')

    if (errDesc) {
      hasAttemptedRef.current = true
      setErrorMessage(errDesc)
      setStatus('error')
      return
    }

    const accessToken = hashParams.get('access_token') || searchParams.get('access_token') || ''
    const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token') || undefined

    if (!accessToken) {
      // Wait until initial auth check finishes—user may already be signed in via cookie
      if (!loading && !user) {
        hasAttemptedRef.current = true
        setErrorMessage('Verification token is missing or has expired. Please request a new confirmation email.')
        setStatus('error')
      }
      return
    }

    hasAttemptedRef.current = true

    async function verifyFromUrl() {
      try {
        await authApi.exchangeSession(accessToken, refreshToken)
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', window.location.pathname)
        }
        await refresh()
        toast.success('Email verified! Welcome to AIChartor.')
        const redirectPath = getSafeRedirectPath(sessionStorage.getItem('redirectAfterSignIn'))
        sessionStorage.removeItem('redirectAfterSignIn')
        window.location.replace(redirectPath)
      } catch (err: any) {
        setErrorMessage(err?.message || 'Verification link is invalid or expired.')
        setStatus('error')
      }
    }

    verifyFromUrl()
  }, [loading, user, searchParams, refresh])

  if (status === 'verifying' || user) {
    return <AuthLoadingCard message="Verifying your email address…" />
  }

  return (
    <AuthCardFrame title="Verification failed" description={errorMessage}>
      <div className="flex flex-col gap-3 pt-2">
        <Button asChild className="w-full rounded-full">
          <Link href="/signin">Go to Sign in</Link>
        </Button>
        <Button asChild variant="outline" className="w-full rounded-full">
          <Link href="/signup">Back to Sign up</Link>
        </Button>
      </div>
    </AuthCardFrame>
  )
}

export default function ConfirmEmailPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={<AuthLoadingCard message="Verifying your email address…" />}>
        <ConfirmEmailContent />
      </Suspense>
    </AuthPageShell>
  )
}
