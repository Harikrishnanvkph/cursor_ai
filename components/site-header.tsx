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
  X,
  ChevronRight
} from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

export function SiteHeader() {
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  // Defer auth-dependent rendering to avoid hydration mismatch:
  // `user` is null during SSR but may be truthy on the client.
  useEffect(() => {
    setMounted(true)
  }, [])

  // Only use the auth state after mount so SSR and first client render match.
  const isAuthenticated = mounted && !!user

  return (
    <header className="w-full bg-white dark:bg-slate-950 transition-colors duration-200 relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition-transform duration-300" />
              <span className="text-lg sm:text-xl font-bold tracking-tight transition-colors text-slate-900 dark:text-white">
                Chartography.in
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {/* Public Navigation */}
            <Button 
              variant="ghost" 
              asChild 
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
            >
              <Link href="/pricing">Pricing</Link>
            </Button>

            {/* User-specific navigation - Only show when user is signed in */}
            {isAuthenticated && (
              <>
                <div className="w-px h-6 mx-3 transition-colors bg-slate-200 dark:bg-slate-800"></div>

                <Button 
                  variant="ghost" 
                  asChild 
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 group text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                >
                  <Link href={user?.is_admin ? "/admin" : "/board"}>
                    <LayoutDashboard className="h-4 w-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                    {user?.is_admin ? "Admin" : "Dashboard"}
                  </Link>
                </Button>

                <Button 
                  variant="ghost" 
                  asChild 
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 group text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                >
                  <Link href="/landing">
                    <Sparkles className="h-4 w-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity text-indigo-500" />
                    AI Chart
                  </Link>
                </Button>

                <Button 
                  variant="ghost" 
                  asChild 
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 group text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                >
                  <Link href="/editor">
                    <Edit3 className="h-4 w-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                    Advanced Editor
                  </Link>
                </Button>
              </>
            )}
          </nav>

          {/* Right side - Auth buttons or User profile */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Profile wrapper */}
                <div>
                  <SimpleProfileDropdown />
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  asChild 
                  className="font-medium text-sm transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                >
                  <Link href="/signin">
                    Sign In
                  </Link>
                </Button>
                
                <Button
                  asChild
                  className="bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent shadow-md shadow-indigo-600/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 rounded-xl px-4 py-1.5 sm:px-4.5 sm:py-2 text-xs sm:text-sm group"
                >
                  <Link href="/signin">
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-indigo-200 group-hover:text-white transition-colors" />
                    Try for Free
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1 opacity-70 group-hover:translate-x-0.5 group-hover:opacity-100 transition-all" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2 rounded-lg transition-colors text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
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

        {/* Mobile Navigation Menu Area */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl overflow-hidden">
            <div className="px-4 py-6 space-y-2">
              <Link
                href="/pricing"
                className="block px-4 py-3 text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>

              {isAuthenticated ? (
                <>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-4 mx-2"></div>
                  <Link
                    href={user?.is_admin ? "/admin" : "/board"}
                    className="flex items-center px-4 py-3 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5 mr-3 text-slate-500" />
                    {user?.is_admin ? "Admin" : "Dashboard"}
                  </Link>
                  <Link
                    href="/landing"
                    className="flex items-center px-4 py-3 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Sparkles className="h-5 w-5 mr-3 text-indigo-500" />
                    AI Chart
                  </Link>
                  <Link
                    href="/editor"
                    className="flex items-center px-4 py-3 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Edit3 className="h-5 w-5 mr-3 text-slate-500" />
                    Advanced Editor
                  </Link>
                </>
              ) : (
                <>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-4 mx-2"></div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Link
                      href="/signin"
                      className="flex items-center justify-center px-4 py-3 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl font-medium transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signin"
                      className="flex items-center justify-center px-4 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-medium shadow-sm shadow-indigo-600/20 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Try for Free
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
