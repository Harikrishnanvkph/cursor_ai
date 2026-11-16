"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { ArrowLeft, Pencil, Check } from 'lucide-react'
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

const USER_NAME_EMPTY_ERROR = 'User name cannot be empty'

/** Returns the part before "@" once the user has typed "@", otherwise an empty string. */
function deriveNameFromEmail(email: string): string {
  const atIndex = email.indexOf('@')
  if (atIndex === -1) return ''
  return email.slice(0, atIndex).trim()
}

export function SignUpForm() {
  const { user, loading, sendOtp, verifyOtp, signInWithGoogle, signInWithGitHub } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [step, setStep] = useState<'details' | 'otp'>('details')
  const [isEditingName, setIsEditingName] = useState(false)
  // True once the user has typed their own (non-empty) name; stops email from overwriting it.
  const [nameManuallySet, setNameManuallySet] = useState(false)
  const [userNameError, setUserNameError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isPending, setIsPending] = useState(false)
  const userNameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const redirect = searchParams.get('redirect')
    if (
      redirect &&
      redirect !== '/signin' &&
      redirect !== '/signup' &&
      !redirect.startsWith('/admin/signin')
    ) {
      sessionStorage.setItem('redirectAfterSignIn', redirect)
    }
  }, [searchParams])

  useEffect(() => {
    if (!loading && user) {
      const redirectPath = sessionStorage.getItem('redirectAfterSignIn') || '/board'
      sessionStorage.removeItem('redirectAfterSignIn')
      router.replace(redirectPath)
    }
  }, [user, loading, router])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  useEffect(() => {
    if (isEditingName) {
      userNameInputRef.current?.focus()
      userNameInputRef.current?.select()
    }
  }, [isEditingName])

  if (loading || user) {
    return <AuthLoadingCard message={user ? 'Redirecting…' : 'Verifying session…'} />
  }

  function handleEmailChange(value: string) {
    setEmail(value)
    // Keep auto-filling from the email until the user has set their own name
    if (!nameManuallySet && !isEditingName) {
      const derived = deriveNameFromEmail(value)
      setUserName(derived)
      if (derived) setUserNameError(null)
    }
  }

  function startEditingName() {
    setIsEditingName(true)
  }

  function finishEditingName() {
    const trimmed = userName.trim()
    const derived = deriveNameFromEmail(email)

    if (!trimmed) {
      // Leaving the box empty falls back to the name before "@"
      setUserName(derived)
      setNameManuallySet(false)
      setUserNameError(null)
    } else {
      setUserName(trimmed)
      setNameManuallySet(trimmed !== derived)
      setUserNameError(null)
    }
    setIsEditingName(false)
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return

    // Fall back to the email-derived name if the field is somehow empty
    const finalName = userName.trim() || deriveNameFromEmail(trimmedEmail)
    if (!finalName) {
      setUserNameError(USER_NAME_EMPTY_ERROR)
      return
    }
    if (isEditingName) {
      setUserName(finalName)
      setNameManuallySet(finalName !== deriveNameFromEmail(trimmedEmail))
      setIsEditingName(false)
    }
    setUserNameError(null)

    setIsPending(true)
    try {
      const ok = await sendOtp(trimmedEmail, 'signup', finalName)
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
      const finalName = userName.trim() || deriveNameFromEmail(email.trim())
      const ok = await sendOtp(email.trim(), 'signup', finalName)
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

  const userNameReadOnlyClassName = isEditingName
    ? ''
    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-default focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800'

  return (
    <AuthCardFrame
      title={step === 'details' ? 'Create your account' : 'Verify your email'}
      description={
        step === 'details'
          ? 'Start generating and styling charts with AI'
          : `Enter the 6-digit code sent to ${email.trim()}`
      }
    >
      {step === 'details' ? (
        <>
          <form onSubmit={handleSendCode} className="space-y-3.5">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
              autoComplete="email"
              className={authInputClassName}
            />

            <div className="relative">
              <Input
                ref={userNameInputRef}
                placeholder={isEditingName ? 'User Name' : 'User Name (optional)'}
                value={userName}
                readOnly={!isEditingName}
                tabIndex={isEditingName ? 0 : -1}
                onChange={(e) => {
                  const val = e.target.value
                  setUserName(val)
                  setUserNameError(val.trim() ? null : USER_NAME_EMPTY_ERROR)
                }}
                onBlur={() => {
                  if (isEditingName) finishEditingName()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isEditingName) {
                    e.preventDefault()
                    finishEditingName()
                  }
                }}
                aria-label="User Name"
                aria-invalid={Boolean(userNameError)}
                className={`${authInputClassName} pr-10 ${userNameReadOnlyClassName}`}
              />
              <button
                type="button"
                // preventDefault keeps the input from blurring before the click is handled
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => (isEditingName ? finishEditingName() : startEditingName())}
                aria-label={isEditingName ? 'Save user name' : 'Edit user name'}
                title={isEditingName ? 'Done' : 'Edit user name'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {isEditingName ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              </button>
            </div>

            <Button
              type="submit"
              className={authPrimaryButtonClassName}
              disabled={isPending || !email.trim() || Boolean(userNameError)}
            >
              {isPending ? 'Sending code…' : 'Continue with email'}
            </Button>

            {userNameError && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400 text-center">
                {userNameError}
              </p>
            )}
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
            {isPending ? 'Creating account…' : 'Verify & create account'}
          </Button>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <button
              type="button"
              onClick={() => {
                setStep('details')
                setOtp('')
              }}
              className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Edit details
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
