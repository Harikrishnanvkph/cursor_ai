"use client"

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Critical Error</CardTitle>
              <CardDescription>
                The application encountered a critical error
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                We're sorry, but the application has encountered a critical error that prevents it from running properly. 
                Please try refreshing the page or contact support if the problem persists.
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
      </body>
    </html>
  )
}

