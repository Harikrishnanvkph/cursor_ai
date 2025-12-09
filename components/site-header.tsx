"use client"

import Link from "next/link"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import {
  MessageSquare,
  Edit3,
  BarChart3,
} from "lucide-react"

export function SiteHeader() {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                AIChartor
              </span>
            </Link>
          </div>

          {/* Main Navigation - Visible to all users */}
          <nav className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-sm">
              <Link href="/pricing">
                Pricing
              </Link>
            </Button>

            <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-sm">
              <Link href="/documentation">
                Docs
              </Link>
            </Button>

            {/* User-specific navigation - Only show when user is signed in */}
            {user && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-sm">
                  <Link href="/landing">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    AI Chat
                  </Link>
                </Button>

                <Button size="sm" asChild className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-5 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5">
                  <Link href="/editor">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Manual Editor
                  </Link>
                </Button>
              </>
            )}
          </nav>

          {/* Right side - Auth buttons or User profile */}
          <div className="flex items-center space-x-3">
            {user ? (
              <SimpleProfileDropdown size="md" />
            ) : (
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Link href="/signin">
                  Start Building
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

