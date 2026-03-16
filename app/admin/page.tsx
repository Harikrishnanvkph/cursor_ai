"use client"

import { useAuth } from "@/components/auth/AuthProvider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { BarChart3, Shield, LayoutTemplate, Settings, LogOut } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin")
    }
    // If user is loaded and is NOT admin, redirect away
    if (!loading && user && !user.is_admin) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!user?.is_admin) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-white/10 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Admin Badge */}
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-105">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    AIChartor
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium -mt-1 uppercase tracking-widest">
                    Admin Panel
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-semibold text-purple-300">Admin</span>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span>{user.email}</span>
              </div>

              <Link
                href="/"
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                Back to App
              </Link>

              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Welcome back, {user.full_name || user.email?.split("@")[0]}
          </h1>
          <p className="mt-2 text-gray-500 text-sm">
            Manage official templates and application settings from this admin dashboard.
          </p>
        </div>

        {/* Admin Navigation Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Templates Action Card */}
          <Link href="/admin/templates" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-900/50 border border-white/5 p-6 hover:border-purple-500/50 transition-all duration-300 block">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                <LayoutTemplate className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Manage Templates</h3>
              <p className="text-sm text-gray-400">
                Create, view, and deploy official chart templates globally to all users.
              </p>
              <div className="mt-6 flex items-center text-sm font-medium text-purple-400 group-hover:text-purple-300">
                Open Templates
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <p className="text-xs text-gray-600 text-center">
            AIChartor Admin Panel &mdash; Internal use only
          </p>
        </div>
      </footer>
    </div>
  )
}
