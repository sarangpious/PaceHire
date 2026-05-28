'use client'

import { useState, useEffect } from 'react'
import GoogleSignInButton from './GoogleSignInButton'

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-200 ${
        scrolled ? 'border-b' : ''
      }`}
      style={
        scrolled
          ? {
              borderColor: 'var(--color-border)',
              backgroundColor: 'rgba(10, 15, 30, 0.95)',
              backdropFilter: 'blur(8px)',
            }
          : { backgroundColor: 'transparent' }
      }
    >
      <span className="text-xl font-bold" style={{ color: 'var(--color-brand)' }}>
        PaceHire
      </span>
      <GoogleSignInButton variant="outline" />
    </header>
  )
}
