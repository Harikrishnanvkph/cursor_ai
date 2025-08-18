"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'
import { Home, ArrowLeft, Search, BarChart3 } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center gap-3">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Search className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Page Not Found</CardTitle>
            <CardDescription>
              The page you're looking for doesn't exist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              The URL you entered doesn't match any pages on our site. 
              This could be due to a typo, an outdated link, or the page may have been moved.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => window.history.back()} 
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/'} 
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-3">
                Or try one of these popular pages:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/landing">
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    <BarChart3 className="mr-1 h-3 w-3" />
                    AI Chat
                  </Button>
                </Link>
                <Link href="/editor">
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    <BarChart3 className="mr-1 h-3 w-3" />
                    Editor
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

