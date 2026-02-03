import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Sol LeWitt — Generative Wall Drawings',
  description: 'Instruction-driven generative wall drawings in a spatial web gallery, a tribute to Sol LeWitt.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
