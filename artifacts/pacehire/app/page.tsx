'use client'

import { useState, useEffect } from 'react'
import { Clock, Zap, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function signInWithGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: process.env.NEXT_PUBLIC_SITE_URL + '/auth/callback',
      },
    })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>

      {/* ── Navbar ──────────────────────────────────────────────────── */}
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
        <button
          onClick={signInWithGoogle}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          style={{ borderColor: 'var(--color-brand)', color: 'var(--color-brand)' }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(26,86,219,0.1)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
          }}
        >
          Sign in with Google
        </button>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 pb-24 pt-24 text-center">
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight">
          Run interviews that finish
          <br />
          on time. Every time.
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          PaceHire gives interviewers a structured pacing layer — visual countdowns, section timers,
          and live alerts. No more rushed endings or overrun loops.
        </p>

        <div className="mb-4 flex items-center justify-center gap-4">
          <button
            onClick={signInWithGoogle}
            className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: 'var(--color-brand)' }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-brand-light)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-brand)'
            }}
          >
            Sign in with Google
          </button>
          <a
            href="/session/demo"
            className="rounded-lg border px-6 py-3 text-sm font-semibold transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = 'var(--color-brand)'
              el.style.color = 'var(--color-brand)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = 'var(--color-border)'
              el.style.color = 'var(--color-text)'
            }}
          >
            Try a demo session
          </a>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Free to start. No credit card required.
        </p>
      </section>

      {/* ── Problem ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Interviews fail on time, not content.
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              Icon: Clock,
              title: 'Intros run too long',
              desc: 'Small talk and context-setting eat into the technical window before you know it.',
            },
            {
              Icon: Zap,
              title: 'Technical sections get rushed',
              desc: 'The core evaluation is squeezed because earlier sections drifted past their budget.',
            },
            {
              Icon: MessageCircle,
              title: 'Candidate questions get skipped',
              desc: "No time is left for the candidate to ask — leaving them with a poor impression.",
            },
          ].map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border p-6"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <Icon className="mb-4 h-6 w-6" style={{ color: 'var(--color-brand)' }} />
              <h3 className="mb-2 text-base font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">How PaceHire works</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              step: '1',
              title: 'Build your template',
              desc: 'Define sections and set a time budget for each — intro, technical, Q&A.',
            },
            {
              step: '2',
              title: 'Launch the session',
              desc: 'One click starts fullscreen pacing mode. Timers begin instantly, no setup friction.',
            },
            {
              step: '3',
              title: 'Stay on track',
              desc: 'Color-coded alerts tell you when to wrap up, move on, or hold steady.',
            },
          ].map(({ step, title, desc }) => (
            <div
              key={step}
              className="rounded-xl border p-6"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div
                className="mb-4 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  backgroundColor: 'rgba(26,86,219,0.15)',
                  color: 'var(--color-brand)',
                }}
              >
                {step}
              </div>
              <h3 className="mb-2 text-base font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer
        className="border-t px-6 py-8 text-center text-sm"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)',
        }}
      >
        PaceHire · Built for structured hiring
      </footer>
    </div>
  )
}
