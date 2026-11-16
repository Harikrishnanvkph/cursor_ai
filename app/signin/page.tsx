"use client"
import { Suspense } from 'react'
import Link from 'next/link'
import { SignInForm } from '@/components/auth/SignInForm'
import { AuthPageShell, AuthLoadingCard } from '@/components/auth/AuthPageShell'

export const dynamic = 'force-static'

export default function SignInPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={<AuthLoadingCard />}>
        <SignInForm />
      </Suspense>
      <p className="mt-5 text-sm text-slate-500 dark:text-slate-400 text-center">
        No account?{' '}
        <Link className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline" href="/signup">
          Sign up
        </Link>
      </p>
    </AuthPageShell>
  )
}
