"use client"
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { authApi } from '@/lib/auth-client'
import { toast } from 'sonner'

export function SignUpForm() {
  const { signUp, signInWithGoogle, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resending, setResending] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [fullNameError, setFullNameError] = useState<string | null>(null)

  // Check for redirect parameter from middleware or ProtectedRoute
  useEffect(() => {
    const redirect = searchParams.get('redirect')
    if (redirect && redirect !== '/signin' && redirect !== '/signup') {
      console.log(`📝 Storing redirect path: ${redirect}`)
      // Store the redirect path for after sign-in, but avoid auth page loops
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
    if (!password || passwordError) {
      return
    }
    try {
      const trimmedEmail = email.trim()
      const trimmedName = fullName.trim()
      const result = await signUp(trimmedEmail, password, trimmedName ? trimmedName : undefined)
      if (result.wasNewUser) {
        // Optional: guide user to check email but stay on page for corrections
      } else {
        // Existing user; do not navigate. Allow them to change email or sign in.
        return
      }
    } catch {
      // error toast is handled inside AuthProvider.signUp
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Join to save charts and sync history</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => {
              const val = e.target.value
              setFullName(val)
              setFullNameError(val.trim() ? null : 'Full name is required')
            }}
            aria-invalid={Boolean(fullNameError)}
          />
          {fullNameError && (
            <div className="text-xs text-red-600">{fullNameError}</div>
          )}
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
          />
          <div className={`text-xs ${password ? (passwordError ? 'text-red-600' : 'text-green-600') : 'text-muted-foreground'}`}>
            {password
              ? (passwordError ? passwordError : 'Password meets the criteria')
              : 'Password with minimum 8 chars, with at least 1 letter & 1 number'}
          </div>
          <Button type="submit" className="w-full" disabled={loading || Boolean(passwordError) || !password || Boolean(fullNameError) || !fullName.trim()}>Sign up</Button>
        </form>
        <div className="mt-2 text-xs text-muted-foreground">
          Didn’t receive a verification email? Check spam/promotions or
          <button
            type="button"
            className="ml-1 underline"
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
            resend it
          </button>
        </div>
        <div className="my-4 text-center text-sm text-muted-foreground">or</div>
        <Button variant="outline" className="w-full" onClick={signInWithGoogle} disabled={loading}>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>
      </CardContent>
    </Card>
  )
}


