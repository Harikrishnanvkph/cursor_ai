"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AuthPageShell, AuthLoadingCard, AuthCardFrame } from '@/components/auth/AuthPageShell'
import { Button } from '@/components/ui/button'

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

export default function AuthSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, refresh } = useAuth()
  const provider = searchParams.get('provider')
  const [refreshing, setRefreshing] = useState(true)
  const hasRefreshedRef = useRef(false)

  useEffect(() => {
    // If user is already authenticated, redirect cleanly with a full navigation
    // to bypass any stale pre-login Next.js Client Router Cache redirects
    if (user) {
      const target = getSafeRedirectPath(sessionStorage.getItem('redirectAfterSignIn'))
      sessionStorage.removeItem('redirectAfterSignIn')
      sessionStorage.removeItem('logged_out_from_oauth')
      window.location.replace(target)
      return
    }

    // Trigger at most one refresh (shares AuthProvider's in-flight /auth/me promise on mount)
    if (!hasRefreshedRef.current) {
      hasRefreshedRef.current = true
      setRefreshing(true)
      refresh()
        .catch((error) => {
          console.error('Failed to refresh user data:', error)
        })
        .finally(() => {
          setRefreshing(false)
        })
    }
  }, [user, refresh])

  // Auto-redirect after 5 seconds if still not authenticated
  useEffect(() => {
    if (!user && !refreshing) {
      const timer = setTimeout(() => {
        router.replace('/signin')
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [user, refreshing, router])

  if (loading || refreshing || user) {
    const providerName = provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : 'OAuth'
    return (
      <AuthPageShell>
        <AuthLoadingCard
          message="Redirecting to your workspace…"
          description={`Signed in successfully with ${providerName}. Setting up your dashboard…`}
        />
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell>
      <AuthCardFrame
        title="Session setup taking longer than expected"
        description="We couldn't confirm your session automatically. Please click below to proceed to your workspace."
      >
        <div className="space-y-3 pt-2">
          <Button
            onClick={() => {
              const target = getSafeRedirectPath(sessionStorage.getItem('redirectAfterSignIn'))
              sessionStorage.removeItem('redirectAfterSignIn')
              window.location.replace(target)
            }}
            className="w-full rounded-full"
          >
            Continue to Dashboard
          </Button>
          <Button
            onClick={() => router.replace('/signin')}
            variant="outline"
            className="w-full rounded-full"
          >
            Go to Sign In
          </Button>
        </div>
      </AuthCardFrame>
    </AuthPageShell>
  )
}
