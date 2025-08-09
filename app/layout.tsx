import type { Metadata } from 'next'
import './globals.css'

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
        {children}
      </body>
    </html>
  )
}
