"use client"

import React from 'react'
import { useAuth } from './AuthProvider'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart2, LogIn, UserPlus } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen w-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If user is authenticated, render the protected content
  if (user) {
    return <>{children}</>
  }

  // If user is not authenticated, show sign-in prompt
  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
            <BarChart2 className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Access Required
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Please sign in to access this feature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-500 mb-6">
            This page requires authentication. Sign in to continue or create a new account.
          </div>
          
          <div className="flex flex-col gap-3">
            <Link href="/signin">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" size="lg">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
            
            <Link href="/signup">
              <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50" size="lg">
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
