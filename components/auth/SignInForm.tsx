"use client"
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function SignInForm() {
  const { signIn, signInWithGoogle, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Check for redirect parameter from middleware or ProtectedRoute
  useEffect(() => {
    const redirect = searchParams.get('redirect')
    if (redirect && redirect !== '/signin' && redirect !== '/signup') {
      console.log(`📝 Storing redirect path: ${redirect}`)
      // Store the redirect path for after sign-in, but avoid auth page loops
      sessionStorage.setItem('redirectAfterSignIn', redirect)
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const success = await signIn(email, password)
      if (success) {
        // Sign in was successful, redirect will be handled by AuthProvider
        console.log('Sign in successful')
      } else {
        // Sign in failed, error toast already shown by AuthProvider
        console.log('Sign in failed')
      }
    } catch (error) {
      // This shouldn't happen now since we're not re-throwing errors
      console.error('Unexpected error in sign in form:', error)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Continue to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={loading}>Sign in</Button>
        </form>
        <div className="mt-3 text-right">
          <Link href="/auth/forgot" className="text-sm text-primary hover:underline">Forgot password?</Link>
        </div>
        <div className="my-4 text-center text-sm text-muted-foreground">or</div>
        <Button variant="outline" className="w-full" onClick={signInWithGoogle} disabled={loading}>
          Continue with Google
        </Button>
      </CardContent>
    </Card>
  )
}


