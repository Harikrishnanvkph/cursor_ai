"use client"
import { Suspense } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { SignInForm } from '@/components/auth/SignInForm'
import { AuthPageShell, AuthLoadingCard } from '@/components/auth/AuthPageShell'

export const dynamic = 'force-static'

function SignInPageContent() {
  const { user, loading } = useAuth()
  const isTransitioning = loading || Boolean(user)

  return (
    <>
      <SignInForm />
      {!isTransitioning && (
        <p className="mt-5 text-sm text-neutral-600 dark:text-slate-400 text-center animate-in fade-in duration-200">
          No account?{' '}
          <Link className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline" href="/signup">
            Sign up
          </Link>
        </p>
      )}
    </>
  )
}

export default function SignInPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={<AuthLoadingCard message="Verifying session…" />}>
        <SignInPageContent />
      </Suspense>
    </AuthPageShell>
  )
}
