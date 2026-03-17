"use client"
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { authApi } from '@/lib/auth-client'
import { toast } from 'sonner'

export function SignUpForm() {
  const { signUp, signInWithGoogle, signInAsGuest, loading } = useAuth()
  const searchParams = useSearchParams()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resending, setResending] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [fullNameError, setFullNameError] = useState<string | null>(null)

  useEffect(() => {
    const redirect = searchParams.get('redirect')
    if (redirect && redirect !== '/signin' && redirect !== '/signup') {
      sessionStorage.setItem('redirectAfterSignIn', redirect)
    }
  }, [searchParams])

  function validatePassword(pw: string): string | null {
    if (!pw || pw.length < 8) return 'Password must be at least 8 characters'
    const hasLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d).+$/.test(pw)
    if (!hasLetterAndNumber) return 'Password must include at least 1 letter and 1 number'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || passwordError) return
    try {
      const result = await signUp(email.trim(), password, fullName.trim() || undefined)
      if (!result.wasNewUser) return
    } catch {
      // error toast handled inside AuthProvider.signUp
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border border-border/60">
      <CardHeader className="pb-4 space-y-1">
        <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Join to save charts and sync history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Input
              placeholder="Full name"
              value={fullName}
              onChange={(e) => {
                const val = e.target.value
                setFullName(val)
                setFullNameError(val.trim() ? null : 'Full name is required')
              }}
              aria-invalid={Boolean(fullNameError)}
              className="h-11"
            />
            {fullNameError && (
              <p className="text-xs text-red-600">{fullNameError}</p>
            )}
          </div>

          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11"
          />

          <div className="space-y-1">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                const val = e.target.value
                setPassword(val)
                setPasswordError(validatePassword(val))
              }}
              required
              aria-invalid={Boolean(passwordError)}
              className="h-11"
            />
            <p className={`text-xs ${password ? (passwordError ? 'text-red-600' : 'text-green-600') : 'text-muted-foreground'}`}>
              {password
                ? (passwordError ? passwordError : '✓ Password meets the criteria')
                : 'Min 8 characters, at least 1 letter & 1 number'}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-semibold"
            disabled={loading || Boolean(passwordError) || !password || Boolean(fullNameError) || !fullName.trim()}
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground">
          Didn't receive a verification email? Check spam/promotions or{' '}
          <button
            type="button"
            className="underline hover:text-foreground transition-colors"
            disabled={resending || !email}
            onClick={async () => {
              if (!email) return
              try {
                setResending(true)
                await authApi.resendVerification({ email })
                toast.success('Verification email resent')
              } catch {
                toast.error('Unable to resend verification email. Try again later.')
              } finally {
                setResending(false)
              }
            }}
          >
            {resending ? 'Sending…' : 'resend it'}
          </button>
        </p>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs text-muted-foreground">
            <span className="bg-card px-2">or</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-11 font-medium"
          onClick={signInWithGoogle}
          disabled={loading}
          type="button"
        >
          <svg className="w-5 h-5 mr-2 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs text-muted-foreground">
            <span className="bg-card px-2">or</span>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full h-11 font-medium text-muted-foreground"
          onClick={signInAsGuest}
          disabled={loading}
          type="button"
        >
          <svg className="w-5 h-5 mr-2 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Sign in as Guest
        </Button>
      </CardContent>
    </Card>
  )
}
