import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'clawd video kit',
  description: 'private video production tool for clawd explains',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
