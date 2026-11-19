import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shared Chart | AIChartor',
  description: 'View and explore this interactive chart shared via AIChartor.',
}

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
