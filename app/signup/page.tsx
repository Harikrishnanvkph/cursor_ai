"use client"
import Link from 'next/link'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { SiteHeader } from '@/components/site-header'

export default function SignUpPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 sm:pt-24 pb-16">
        <SignUpForm />
        <p className="mt-4 text-sm text-muted-foreground text-center">
          Already have an account?{' '}
          <Link className="text-primary font-medium hover:underline" href="/signin">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  )
}
