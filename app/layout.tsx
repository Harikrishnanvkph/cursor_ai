import type { Metadata } from 'next'
import './globals.css'
import "@/lib/chart-registration"
import { AuthProvider } from '@/components/auth/AuthProvider'
import { Toaster } from '@/components/ui/sonner'
import ConsoleSilencer from '@/components/ConsoleSilencer'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'AI Chartor — AI-Powered Charts & Infographic Studio',
  description: 'Create interactive charts and infographics with natural language AI and our powerful Advanced Editor canvas.',
  metadataBase: new URL('https://aichartor.com'),
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground subpixel-antialiased">
        <ConsoleSilencer />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
