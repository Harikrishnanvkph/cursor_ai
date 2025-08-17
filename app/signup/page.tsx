"use client"
import Link from 'next/link'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { SiteHeader } from '@/components/site-header'

export default function SignUpPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center gap-3">
        <SignUpForm />
        <div className="text-sm text-center">
          Already have an account? <Link className="underline" href="/signin">Sign in</Link>
        </div>
      </div>
    </div>
  )
}


