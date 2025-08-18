"use client"

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center gap-3">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
            <CardDescription>
              An unexpected error occurred
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              We're sorry, but something went wrong while loading this page. 
              This might be a temporary issue that can be resolved by refreshing.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={reset} 
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline"
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="pt-4 border-t border-gray-200">
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="bg-gray-100 p-3 rounded text-left font-mono text-xs overflow-auto">
                    <div className="text-red-600 font-semibold mb-1">
                      {error.name}: {error.message}
                    </div>
                    {error.stack && (
                      <pre className="whitespace-pre-wrap text-gray-700">
                        {error.stack}
                      </pre>
                    )}
                    {error.digest && (
                      <div className="text-gray-600 mt-2">
                        Error ID: {error.digest}
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

