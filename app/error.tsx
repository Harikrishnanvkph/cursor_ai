"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'
import { RefreshCw, Home, AlertTriangle, Loader2 } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// Check if this is a ChunkLoadError (stale webpack chunks)
function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    error.message?.includes('ChunkLoadError') ||
    error.message?.includes('Loading chunk') ||
    error.message?.includes('Failed to fetch dynamically imported module') ||
    error.stack?.includes('__webpack_require__')
  )
}

export default function Error({ error, reset }: ErrorProps) {
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false)
  const isChunkError = isChunkLoadError(error)

  useEffect(() => {
    console.error('Application error:', error)
    
    // Auto-refresh for ChunkLoadError
    if (isChunkError) {
      const lastRefreshKey = 'chunk_error_last_refresh'
      const lastRefresh = sessionStorage.getItem(lastRefreshKey)
      const now = Date.now()
      
      // Only auto-refresh if we haven't refreshed in the last 10 seconds
      if (!lastRefresh || now - parseInt(lastRefresh) > 10000) {
        console.log('ChunkLoadError detected, auto-refreshing...')
        setIsAutoRefreshing(true)
        sessionStorage.setItem(lastRefreshKey, now.toString())
        
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    }
  }, [error, isChunkError])

  // Show loading state for chunk errors that are auto-refreshing
  if (isChunkError && isAutoRefreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Refreshing...</h2>
          <p className="text-sm text-gray-600">Updating application resources</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center gap-3">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
              isChunkError ? 'bg-amber-100' : 'bg-orange-100'
            }`}>
              <AlertTriangle className={`h-8 w-8 ${isChunkError ? 'text-amber-600' : 'text-orange-600'}`} />
            </div>
            <CardTitle className="text-2xl">
              {isChunkError ? 'Update Required' : 'Something went wrong'}
            </CardTitle>
            <CardDescription>
              {isChunkError 
                ? 'The application needs to refresh to load updated resources'
                : 'An unexpected error occurred'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              {isChunkError
                ? 'This happens when the application has been updated. A quick refresh will fix it.'
                : "We're sorry, but something went wrong while loading this page. This might be a temporary issue that can be resolved by refreshing."}
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {isChunkError ? 'Refresh Now' : 'Try Again'}
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

