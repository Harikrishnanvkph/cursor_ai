"use client"
import { Suspense } from 'react'
import Link from 'next/link'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { AuthPageShell, AuthLoadingCard } from '@/components/auth/AuthPageShell'

export default function SignUpPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={<AuthLoadingCard />}>
        <SignUpForm />
      </Suspense>
      <p className="mt-5 text-sm text-slate-500 dark:text-slate-400 text-center">
        Already have an account?{' '}
        <Link className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline" href="/signin">
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  )
}
