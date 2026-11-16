"use client"
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import {
  AuthCardFrame,
  AuthLoadingCard,
  AuthGoogleSection,
  authInputClassName,
  authPrimaryButtonClassName,
} from '@/components/auth/AuthPageShell'
import { toast } from 'sonner'

export function SignInForm() {
  const { user, loading, sendOtp, verifyOtp, signInWithGoogle, signInWithGitHub } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    const redirect = searchParams.get('redirect') || searchParams.get('returnUrl')
    if (
      redirect &&
      redirect.startsWith('/') &&
      !redirect.startsWith('//') &&
      redirect !== '/signin' &&
      redirect !== '/signup' &&
      !redirect.startsWith('/admin/signin')
    ) {
      sessionStorage.setItem('redirectAfterSignIn', redirect)
    }
  }, [searchParams])

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      toast.error(errorParam)
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  useEffect(() => {
    if (!loading && user) {
      const redirectPath = sessionStorage.getItem('redirectAfterSignIn') || '/board'
      sessionStorage.removeItem('redirectAfterSignIn')
      sessionStorage.removeItem('logged_out_from_oauth')
      router.replace(redirectPath)
    }
  }, [user, loading, router])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const loggedOut = sessionStorage.getItem('logged_out_from_oauth')
    if (loggedOut === 'true') {
      window.history.pushState({ type: 'signin-back-interceptor' }, '')

      const handlePopState = () => {
        sessionStorage.removeItem('logged_out_from_oauth')
        sessionStorage.setItem('exiting_app', 'true')
        window.location.replace('/')
      }

      window.addEventListener('popstate', handlePopState)
      return () => {
        window.removeEventListener('popstate', handlePopState)
      }
    }
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  if (loading || user) {
    return <AuthLoadingCard message={user ? 'Redirecting to your workspace…' : 'Verifying session…'} />
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setIsPending(true)
    try {
      const ok = await sendOtp(trimmed, 'signin')
      if (ok) {
        setOtp('')
        setOtpError(null)
        setStep('otp')
        setResendCooldown(30)
      }
    } finally {
      setIsPending(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) return
    setOtpError(null)
    setIsPending(true)
    try {
      const res = await verifyOtp(email.trim(), otp)
      if (!res.ok) {
        setOtpError(res.error || 'Invalid or expired verification code. Please try again.')
      }
    } finally {
      setIsPending(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || isPending) return
    setOtpError(null)
    setIsPending(true)
    try {
      const ok = await sendOtp(email.trim(), 'signin')
      if (ok) {
        setResendCooldown(30)
      }
    } finally {
      setIsPending(false)
    }
  }

  async function handleGoogleSignIn() {
    setIsPending(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Unexpected error in Google sign in:', error)
      setIsPending(false)
    }
  }

  async function handleGitHubSignIn() {
    setIsPending(true)
    try {
      await signInWithGitHub()
    } catch (error) {
      console.error('Unexpected error in GitHub sign in:', error)
      setIsPending(false)
    }
  }

  return (
    <AuthCardFrame
      title={step === 'email' ? 'Welcome back' : 'Check your email'}
      description={
        step === 'email'
          ? 'Sign in to continue to your AIChartor workspace'
          : `We sent a 6-digit verification code to ${email.trim()}`
      }
    >
      {step === 'email' ? (
        <>
          <form onSubmit={handleSendCode} className="space-y-3.5">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={authInputClassName}
            />

            <Button type="submit" className={authPrimaryButtonClassName} disabled={isPending || !email.trim()}>
              {isPending ? 'Sending code…' : 'Continue with email'}
            </Button>
          </form>

          <AuthGoogleSection disabled={isPending} onClick={handleGoogleSignIn} onGitHubClick={handleGitHubSignIn} />
        </>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-center py-1">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(val) => {
                  setOtp(val.replace(/\D/g, ''))
                  if (otpError) setOtpError(null)
                }}
                disabled={isPending}
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className={`h-12 w-11 rounded-xl border bg-slate-50/80 dark:bg-slate-950/60 text-base font-semibold text-slate-900 dark:text-slate-100 first:rounded-xl last:rounded-xl ${
                        otpError
                          ? 'border-red-400 dark:border-red-500'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            {otpError && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400 text-center">
                {otpError}
              </p>
            )}
          </div>

          <Button type="submit" className={authPrimaryButtonClassName} disabled={isPending || otp.length !== 6}>
            {isPending ? 'Verifying…' : 'Verify & sign in'}
          </Button>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setOtp('')
              }}
              className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Use different email
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isPending}
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </AuthCardFrame>
  )
}
