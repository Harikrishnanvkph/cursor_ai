"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { authApi } from '@/lib/auth-client'

export default function AuthSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const provider = searchParams.get('provider')
  const [refreshing, setRefreshing] = useState(true)

  useEffect(() => {
    const refreshUserData = async () => {
      try {
        setRefreshing(true)
        // Force refresh user data from backend
        const res = await authApi.me()
        if (res.user) {
          // Update the user state in AuthProvider
          window.location.reload()
          return
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error)
      } finally {
        setRefreshing(false)
      }
    }

    // If user is already authenticated, redirect to home
    if (user) {
      toast.success(`Successfully signed in with ${provider || 'OAuth'}!`)
      router.push('/')
      return
    }

    // If not authenticated, try to refresh user data
    if (!loading) {
      refreshUserData()
    }
  }, [user, loading, router, provider])

  // Auto-redirect after 5 seconds if still not authenticated
  useEffect(() => {
    if (!user && !refreshing) {
      const timer = setTimeout(() => {
        router.push('/signin')
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [user, refreshing, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Authentication Successful!</CardTitle>
          <CardDescription>
            You have successfully signed in with {provider || 'OAuth'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {loading || refreshing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Setting up your session...</span>
              </div>
              <p className="text-sm text-gray-600">
                Please wait while we complete your authentication.
              </p>
            </div>
          ) : user ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-12 h-12 rounded-full border-2 border-green-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">
                      {user.full_name?.[0] || user.email?.[0] || 'U'}
                    </span>
                  </div>
                )}
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    Welcome back, {user.full_name || user.email}!
                  </p>
                  {user.provider && (
                    <p className="text-sm text-gray-500">
                      Signed in with {user.provider}
                    </p>
                  )}
                </div>
              </div>
              <Button onClick={() => router.push('/')} className="w-full">
                Continue to Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Redirecting you to sign in...
              </p>
              <Button onClick={() => router.push('/signin')} variant="outline" className="w-full">
                Go to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
