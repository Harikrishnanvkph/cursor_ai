import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { Toaster } from '@/components/ui/sonner'
import ConsoleSilencer from '@/components/ConsoleSilencer'

export const metadata: Metadata = {
  title: 'chart development',
  description: 'Created by Hari',
  generator: 'v0',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full bg-gray-50" style={{ backgroundColor: '#f9fafb' }}>
      <body className="min-h-screen bg-gray-50" style={{ backgroundColor: '#f9fafb' }}>
        <ConsoleSilencer />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  )
}
