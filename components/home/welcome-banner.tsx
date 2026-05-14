"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import Image from "next/image"

/**
 * Client island for the floating welcome popup + OAuth redirect handler.
 * Only renders after mount and when user is authenticated.
 * Extracted from the home page to allow server rendering of static content.
 */
export function WelcomeBanner() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isAuthenticated = mounted && !!user

  // Only show welcome banner once per session
  useEffect(() => {
    if (typeof window === 'undefined') return
    const shown = sessionStorage.getItem('welcomeShown')
    if (!shown) {
      setShowWelcome(true)
      sessionStorage.setItem('welcomeShown', '1')
    }
  }, [])

  // Handle OAuth success redirect
  useEffect(() => {
    const oauthSuccess = searchParams.get('oauth')
    if (oauthSuccess === 'success') {
      const url = new URL(window.location.href)
      url.searchParams.delete('oauth')
      window.history.replaceState({}, '', url.toString())
      toast.success('Successfully signed in with Google!')
      const timer = setTimeout(() => setShowWelcome(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  // Auto-hide welcome banner after 5 seconds for existing users
  useEffect(() => {
    if (user && showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [user, showWelcome])

  if (!isAuthenticated || !showWelcome) return null

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-pop-in pointer-events-auto">
      <div className="bg-white dark:bg-slate-900 border border-indigo-500/20 rounded-2xl p-1 shadow-2xl shadow-indigo-500/20 max-w-sm w-full mx-auto ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-center justify-between gap-4 pl-3 pr-2 py-1.5">
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <div className="relative">
                <Image
                  src={user.avatar_url}
                  alt="Profile"
                  width={36}
                  height={36}
                  className="rounded-xl ring-2 ring-indigo-500/20 object-cover"
                  referrerPolicy="no-referrer"
                  priority
                />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user.full_name?.[0] || user.email?.[0] || 'U'}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                Welcome back, {user.full_name?.split(' ')[0] || user.email?.split('@')[0]}!
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-[10px] px-1.5 py-0 h-4 font-medium">
                  Ready to create
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowWelcome(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
