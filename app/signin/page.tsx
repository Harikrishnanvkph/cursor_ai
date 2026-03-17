"use client"
import Link from 'next/link'
import { SignInForm } from '@/components/auth/SignInForm'
export const dynamic = 'force-static'
import { SiteHeader } from '@/components/site-header'

export default function SignInPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 sm:pt-24 pb-16">
        <SignInForm />
        <p className="mt-4 text-sm text-muted-foreground text-center">
          No account?{' '}
          <Link className="text-primary font-medium hover:underline" href="/signup">
            Sign up
          </Link>
        </p>
      </main>
    </div>
  )
}
