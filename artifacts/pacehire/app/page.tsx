import { Clock, Zap, MessageCircle } from 'lucide-react'
import LandingNavbar from '@/app/components/LandingNavbar'
import GoogleSignInButton from '@/app/components/GoogleSignInButton'

export default function HomePage() {
  return (
    <div className="animate-page-in min-h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>

      <LandingNavbar />

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

        <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <GoogleSignInButton variant="primary" />
          <a
            href="/session/demo"
            className="rounded-lg border px-6 py-3 text-sm font-semibold transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            onMouseEnter={undefined}
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
