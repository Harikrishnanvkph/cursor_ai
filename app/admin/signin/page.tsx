"use client"

import React, { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { BarChart3, Eye, EyeOff, Loader2, LogOut, Shield, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function getSafeAdminRedirect(rawRedirect: string | null): string {
  if (
    rawRedirect &&
    rawRedirect.startsWith("/admin") &&
    !rawRedirect.startsWith("/admin/signin")
  ) {
    return rawRedirect
  }
  return "/admin"
}

function AdminSignInContent() {
  const { user, loading, sessionVerified, signIn, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const targetRedirect = getSafeAdminRedirect(searchParams.get("redirect"))

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      toast.error(errorParam)
      const url = new URL(window.location.href)
      url.searchParams.delete("error")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  useEffect(() => {
    if (sessionVerified && user?.is_admin) {
      sessionStorage.removeItem("redirectAfterSignIn")
      sessionStorage.removeItem("logged_out_from_oauth")
      router.replace(targetRedirect)
    }
  }, [user, sessionVerified, router, targetRedirect])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsPending(true)
    try {
      await signIn(email, password, {
        redirectTo: targetRedirect,
        adminOnly: true,
      })
    } catch (error) {
      console.error("Unexpected error in admin sign in:", error)
    } finally {
      setIsPending(false)
    }
  }

  if (!sessionVerified || loading || user?.is_admin) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-gray-900/80 border border-white/10 backdrop-blur-xl p-8 flex flex-col items-center justify-center min-h-[300px] shadow-2xl">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">
          {user?.is_admin ? "Redirecting to Admin Panel..." : "Verifying admin session..."}
        </p>
      </div>
    )
  }

  // Signed in with a non-admin account: show explicit access notice instead of redirecting to /board
  if (user && !user.is_admin) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-gray-900/80 border border-white/10 backdrop-blur-xl p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-semibold text-white">Admin Access Required</h1>
          <p className="mt-2 text-sm text-gray-400">
            You are currently signed in as{" "}
            <span className="text-gray-200 font-medium">{user.email}</span>, which does not have
            admin privileges.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={() => signOut("/admin/signin")}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out &amp; switch account
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full h-11 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white"
          >
            <Link href="/board">Go to Workspace</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-gray-900/80 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-purple-300">Admin</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">Admin Sign In</h1>
        <p className="mt-1.5 text-sm text-gray-400">
          Sign in with an administrator account to access AIChartor Admin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Admin email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11 rounded-xl bg-gray-950/70 border-white/10 text-white placeholder:text-gray-500 focus-visible:border-purple-500 focus-visible:ring-purple-500/20"
        />

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 rounded-xl bg-gray-950/70 border-white/10 text-white placeholder:text-gray-500 focus-visible:border-purple-500 focus-visible:ring-purple-500/20 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-purple-500/20"
        >
          {isPending ? "Signing in..." : "Sign in to Admin"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          ← Back to AIChartor
        </Link>
      </div>
    </div>
  )
}

export default function AdminSignInPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full flex justify-center">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-2xl bg-gray-900/80 border border-white/10 p-8 flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-4" />
              <p className="text-sm text-gray-400">Loading admin sign in...</p>
            </div>
          }
        >
          <AdminSignInContent />
        </Suspense>
      </div>
    </div>
  )
}
