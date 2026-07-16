'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="header">
      <div className="header-inner">
        <span className="logo">🦞 clawd video kit</span>
        <span className="tagline">gap analysis → notebooklm doc → youtube description</span>
        <nav className="header-nav">
          <Link href="/" className={pathname === '/' ? 'nav-link active' : 'nav-link'}>
            kit
          </Link>
          <Link href="/larva-video" className={pathname === '/larva-video' ? 'nav-link active' : 'nav-link'}>
            larva
          </Link>
          <Link href="/about" className={pathname === '/about' ? 'nav-link active' : 'nav-link'}>
            about
          </Link>
        </nav>
      </div>
    </header>
  )
}
