"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resending, setResending] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [fullNameError, setFullNameError] = useState<string | null>(null)

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
          Continue with Google
        </Button>
      </CardContent>
    </Card>
  )
}


