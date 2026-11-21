"use client"
import { Suspense } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { AuthPageShell, AuthLoadingCard } from '@/components/auth/AuthPageShell'

function SignUpPageContent() {
  const { user, loading } = useAuth()
  const isTransitioning = loading || Boolean(user)

  return (
    <>
      <SignUpForm />
      {!isTransitioning && (
        <p className="mt-5 text-sm text-neutral-600 dark:text-slate-400 text-center animate-in fade-in duration-200">
          Already have an account?{' '}
          <Link className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline" href="/signin">
            Sign in
          </Link>
        </p>
      )}
    </>
  )
}

export default function SignUpPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={<AuthLoadingCard message="Verifying session…" />}>
        <SignUpPageContent />
      </Suspense>
    </AuthPageShell>
  )
}
