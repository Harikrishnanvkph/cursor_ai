"use client"
import Link from 'next/link'
import { SignInForm } from '@/components/auth/SignInForm'
export const dynamic = 'force-static'
import { SiteHeader } from '@/components/site-header'

export default function SignInPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center gap-3">
        <SignInForm />
        <div className="text-sm text-center">
          No account? <Link className="underline" href="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  )
}


