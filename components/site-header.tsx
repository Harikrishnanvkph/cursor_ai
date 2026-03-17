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
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function SiteHeader() {
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  
  // Determine if we are on the homepage to apply specific transparent-to-solid styling
  const isHomepage = pathname === "/"

  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 border-b ${
        scrolled 
          ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-slate-200/80 dark:border-slate-800/80 shadow-sm" 
          : isHomepage 
            ? "bg-transparent border-transparent" 
            : "bg-white dark:bg-slate-950 border-transparent dark:border-slate-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-300 group-hover:scale-105">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight transition-colors text-slate-900 dark:text-white">
                  AIChartor
                </span>
                <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider -mt-1 transition-colors text-slate-500 dark:text-slate-400">
                  AI Chart Platform
                </span>
              </div>
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

            <Button 
              variant="ghost" 
              asChild 
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
            >
              <Link href="/documentation">Documentation</Link>
            </Button>

            {/* User-specific navigation - Only show when user is signed in */}
            {user && (
              <>
                <div className="w-px h-6 mx-3 transition-colors bg-slate-200 dark:bg-slate-800"></div>

                <Button 
                  variant="ghost" 
                  asChild 
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 group text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-slate-300 dark:hover:text-indigo-300 dark:hover:bg-indigo-500/10"
                >
                  <Link href="/landing">
                    <MessageSquare className="h-4 w-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                    AI Chat
                  </Link>
                </Button>

                <Button 
                  variant="ghost" 
                  asChild 
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 group text-slate-600 hover:text-purple-700 hover:bg-purple-50 dark:text-slate-300 dark:hover:text-purple-300 dark:hover:bg-purple-500/10"
                >
                  <Link href="/board">
                    <LayoutDashboard className="h-4 w-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                    Dashboard
                  </Link>
                </Button>

                <div className="pl-2">
                  <Button 
                    asChild 
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white border border-transparent shadow-sm hover:shadow transition-all duration-200 rounded-lg px-4"
                  >
                    <Link href="/editor">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editor
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </nav>

          {/* Right side - Auth buttons or User profile */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Status Badge */}
                <span className="hidden sm:flex items-center text-xs font-medium px-2 py-1 rounded-full border transition-colors bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                  Online
                </span>
                
                {/* Profile wrapper */}
                <div>
                  <SimpleProfileDropdown />
                </div>
                
                {/* Theme Toggle */}
                <ThemeToggle className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800" />
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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent shadow-md shadow-indigo-600/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 rounded-xl px-5 group"
                >
                  <Link href="/signin">
                    <Sparkles className="h-4 w-4 mr-2 text-indigo-200 group-hover:text-white transition-colors" />
                    Start Creating
                    <ChevronRight className="h-4 w-4 ml-1 opacity-70 group-hover:translate-x-0.5 group-hover:opacity-100 transition-all" />
                  </Link>
                </Button>
                
                {/* Theme Toggle */}
                <ThemeToggle className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800" />
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

        {/* Mobile Navigation Menu Area (unchanged but cleaned up) */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl overflow-hidden">
            <div className="px-4 py-6 space-y-2">
              <div className="flex justify-between items-center mb-2 px-4">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Theme</span>
                <ThemeToggle />
              </div>
              <Link
                href="/pricing"
                className="block px-4 py-3 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/documentation"
                className="block px-4 py-3 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Documentation
              </Link>

              {user ? (
                <>
                  <div className="h-px bg-slate-100 my-4 mx-2"></div>
                  <Link
                    href="/landing"
                    className="flex items-center px-4 py-3 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageSquare className="h-5 w-5 mr-3 text-indigo-500" />
                    AI Chat
                  </Link>
                  <Link
                    href="/board"
                    className="flex items-center px-4 py-3 text-slate-700 hover:text-purple-600 hover:bg-purple-50 rounded-xl font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5 mr-3 text-purple-500" />
                    Dashboard
                  </Link>
                  <Link
                    href="/editor"
                    className="flex items-center px-4 py-3 mt-2 text-white bg-slate-900 hover:bg-slate-800 rounded-xl font-medium shadow-sm transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Edit3 className="h-5 w-5 mr-3 text-slate-400" />
                    Advanced Editor
                  </Link>
                </>
              ) : (
                <>
                  <div className="h-px bg-slate-100 my-4 mx-2"></div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Link
                      href="/signin"
                      className="flex items-center justify-center px-4 py-3 text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signin"
                      className="flex items-center justify-center px-4 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-medium shadow-sm shadow-indigo-600/20 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Start Creating
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
