"use client"
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { authApi } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = params.get('access_token') || params.get('token')
    if (t) setToken(t)
  }, [params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || passwordError) {
      return
    }
    if (!token) {
      toast.error('Missing or invalid reset token.')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword({ token, password })
      toast.success('Password has been reset. You can now sign in.')
      router.push('/signin')
    } catch {
      toast.error('Failed to reset password. Please request a new link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center py-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Choose a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => {
                const val = e.target.value
                setPassword(val)
                const err = !val || val.length < 8
                  ? 'Password must be at least 8 characters'
                  : (/^(?=.*[A-Za-z])(?=.*\d).+$/.test(val) ? null : 'Password must include at least 1 letter and 1 number')
                setPasswordError(err)
              }}
              required
              aria-invalid={Boolean(passwordError)}
            />
            <div className={`text-xs ${password ? (passwordError ? 'text-red-600' : 'text-green-600') : 'text-muted-foreground'}`}>
              {password
                ? (passwordError ? passwordError : 'Password meets the criteria')
                : 'Password must be at least 8 characters and include at least one letter and one number.'}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>Reset password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


