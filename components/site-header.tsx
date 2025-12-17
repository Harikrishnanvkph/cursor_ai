"use client"

import Link from "next/link"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import {
  MessageSquare,
  Edit3,
  BarChart3,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  Menu,
  X
} from "lucide-react"
import { useState } from "react"

export function SiteHeader() {
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 shadow-sm">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-white/50 to-purple-50/50 -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  AIChartor
                </span>
                <span className="text-xs text-gray-500 font-medium -mt-1">
                  AI Chart Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {/* Public Navigation */}
            <Button variant="ghost" size="md" asChild className="text-gray-600 hover:text-gray-900 hover:bg-white/60 px-5 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-sm">
              <Link href="/pricing">
                Pricing
              </Link>
            </Button>

            <Button variant="ghost" size="md" asChild className="text-gray-600 hover:text-gray-900 hover:bg-white/60 px-5 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-sm">
              <Link href="/documentation">
                Documentation
              </Link>
            </Button>

            {/* User-specific navigation - Only show when user is signed in */}
            {user && (
              <>
                <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent mx-4"></div>
                
                <Button variant="ghost" size="md" asChild className="text-gray-600 hover:text-blue-700 hover:bg-blue-50/80 px-5 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-sm group">
                  <Link href="/landing">
                    <MessageSquare className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    AI Chat
                  </Link>
                </Button>

                <Button variant="ghost" size="md" asChild className="text-gray-600 hover:text-purple-700 hover:bg-purple-50/80 px-5 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-sm group">
                  <Link href="/board">
                    <LayoutDashboard className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    Dashboard
                  </Link>
                </Button>

                <Button size="md" asChild className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105">
                  <Link href="/editor">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Advanced Editor
                  </Link>
                </Button>
              </>
            )}
          </nav>

          {/* Right side - Auth buttons or User profile */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Status Badge for authenticated users */}
                <Badge className="hidden sm:flex bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Online
                </Badge>
                <SimpleProfileDropdown size="md" />
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="md" asChild className="hidden sm:flex text-gray-600 hover:text-gray-900 hover:bg-white/60 px-5 py-3 rounded-xl font-medium transition-all duration-200">
                  <Link href="/signin">
                    Sign In
                  </Link>
                </Button>
                <Button
                  size="md"
                  asChild
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white px-7 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 group"
                >
                  <Link href="/signin">
                    <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                    Start Creating
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2 hover:bg-white/60 rounded-xl transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/20 bg-white/95 backdrop-blur-xl rounded-b-2xl shadow-xl mt-3 overflow-hidden">
            <div className="px-6 py-8 space-y-4">
              {/* Public Links */}
              <Link
                href="/pricing"
                className="block px-5 py-4 text-gray-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl font-medium transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/documentation"
                className="block px-5 py-4 text-gray-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl font-medium transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Documentation
              </Link>

              {user ? (
                <>
                  <div className="border-t border-gray-200/50 my-4"></div>
                  <Link
                    href="/landing"
                    className="flex items-center px-5 py-4 text-gray-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl font-medium transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageSquare className="h-5 w-5 mr-3" />
                    AI Chat
                  </Link>
                  <Link
                    href="/board"
                    className="flex items-center px-5 py-4 text-gray-700 hover:text-purple-700 hover:bg-purple-50/80 rounded-xl font-medium transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5 mr-3" />
                    Dashboard
                  </Link>
                  <Link
                    href="/editor"
                    className="flex items-center px-5 py-4 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold shadow-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Edit3 className="h-5 w-5 mr-3" />
                    Advanced Editor
                  </Link>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-200/50 my-4"></div>
                  <Link
                    href="/signin"
                    className="block px-5 py-4 text-gray-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl font-medium transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signin"
                    className="flex items-center justify-center px-5 py-4 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold shadow-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Start Creating
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

