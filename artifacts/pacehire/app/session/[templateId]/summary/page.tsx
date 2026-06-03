'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CheckCircle2, RotateCcw, ArrowLeft, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────

type SectionEntry = {
  id: string
  name: string
  plannedSeconds: number
  actualSeconds: number
  skipped: boolean
}

type SessionResult = {
  templateId: string
  templateName: string
  plannedDuration: number // minutes
  actualDuration: number  // seconds
  startedAt: string       // ISO
  sections: SectionEntry[]
  candidateName?: string
  roleName?: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'guest'

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDuration(seconds: number): string {
  const abs = Math.abs(Math.round(seconds))
  const m = Math.floor(abs / 60)
  const s = abs % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}m`
  return `${m}m ${s}s`
}

function fmtDiff(diffSeconds: number): { label: string; color: string } {
  const abs = Math.abs(Math.round(diffSeconds))
  if (abs < 10) return { label: 'On time', color: '#22c55e' }
  const text = fmtDuration(abs)
  return diffSeconds > 0
    ? { label: `+${text} over`, color: '#ef4444' }
    : { label: `${text} under`, color: '#22c55e' }
}

function sectionRowColor(entry: SectionEntry): string {
  if (entry.skipped) return '#475569'
  const diff = entry.actualSeconds - entry.plannedSeconds
  if (diff <= 0) return '#22c55e'
  if (diff <= 120) return '#f59e0b'
  return '#ef4444'
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const REC_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  strong_yes: { label: 'Strong Yes', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  yes:        { label: 'Yes',        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  no:         { label: 'No',         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  strong_no:  { label: 'Strong No',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SummaryPage() {
  const params = useParams()
  const templateId = params.templateId as string

  const [data, setData] = useState<SessionResult | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [loading, setLoading] = useState(true)
  const [scorecard, setScorecard] = useState<{
    rating: number | null
    recommendation: string | null
    notes: string | null
  } | null>(null)
  const savedRef = useRef(false)

  useEffect(() => {
    // 1. Try sessionStorage (just-finished session)
    let result: SessionResult | null = null
    try {
      const raw = sessionStorage.getItem('pacehire_session_result')
      if (raw) result = JSON.parse(raw)
    } catch {}

    if (result) {
      setData(result)
      setLoading(false)

      // Avoid duplicate saves
      if (savedRef.current) return
      savedRef.current = true

      ;(async () => {
        setSaveState('saving')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setSaveState('guest')
          return
        }

        // If the URL param differs from the template ID stored in sessionStorage,
        // the session was pre-created (modal flow). UPDATE instead of INSERT.
        const isPreCreated =
          templateId !== result!.templateId && templateId !== 'demo'

        if (isPreCreated) {
          // Session was already saved by the scorecard page — just clear and show.
          try { sessionStorage.removeItem('pacehire_session_result') } catch {}
          setSaveState('saved')
          return
        }

        // Old / demo flow: INSERT a new session record
        const { error } = await supabase.from('sessions').insert({
          user_id: user.id,
          template_id: result!.templateId === 'demo' ? null : result!.templateId,
          template_snapshot: {
            name: result!.templateName,
            sections: result!.sections,
          },
          started_at: result!.startedAt,
          ended_at: new Date().toISOString(),
          planned_duration: result!.plannedDuration,
          actual_duration: result!.actualDuration,
          section_results: result!.sections,
        })

        if (error) {
          setSaveState('error')
          return
        }

        try { sessionStorage.removeItem('pacehire_session_result') } catch {}
        setSaveState('saved')
      })()
      return
    }

    // 2. sessionStorage empty — load historical session from Supabase by session ID
    ;(async () => {
      const supabase = createClient()
      const { data: session } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', templateId)
        .single()

      if (!session) {
        setLoading(false)
        return
      }

      type Snapshot = { name?: string } | null
      const snapshot = session.template_snapshot as Snapshot
      const historical: SessionResult = {
        templateId: session.template_id ?? templateId,
        templateName: snapshot?.name ?? 'Unknown Template',
        plannedDuration: session.planned_duration ?? 0,
        actualDuration: session.actual_duration ?? 0,
        startedAt: session.started_at ?? session.ended_at ?? new Date().toISOString(),
        sections: (session.section_results as SectionEntry[]) ?? [],
        candidateName: session.candidate_name ?? undefined,
        roleName: session.role_name ?? undefined,
      }
      setData(historical)
      setSaveState('saved') // already persisted

      // Load scorecard data if present
      if (session.recommendation || session.overall_rating) {
        setScorecard({
          rating: session.overall_rating ?? null,
          recommendation: session.recommendation ?? null,
          notes: session.post_session_notes ?? null,
        })
      }

      setLoading(false)
    })()
  }, [templateId])

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: '#0a0f1e' }}
      >
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: '#1A56DB', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  // ── Guard: no data ─────────────────────────────────────────────
  if (!data) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4"
        style={{ backgroundColor: '#0a0f1e', color: '#f1f5f9' }}
      >
        <p className="text-sm" style={{ color: '#94a3b8' }}>No session data found.</p>
        <Link
          href="/dashboard"
          className="text-sm font-medium"
          style={{ color: '#1A56DB' }}
        >
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  // ── Computed values ────────────────────────────────────────────
  const plannedSeconds = data.plannedDuration * 60
  const overallDiff = data.actualDuration - plannedSeconds
  const { label: diffLabel, color: diffColor } = fmtDiff(overallDiff)
  const isDemo = templateId === 'demo'
  const rec = scorecard?.recommendation ? REC_LABELS[scorecard.recommendation] : null

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#0a0f1e', color: '#f1f5f9' }}
    >
      <div className="mx-auto max-w-3xl px-6 py-12">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}
          >
            <CheckCircle2 className="h-7 w-7" style={{ color: '#22c55e' }} />
          </div>
          <h1 className="text-3xl font-bold">Session Complete</h1>
          <p className="mt-1 text-lg font-medium" style={{ color: '#94a3b8' }}>
            {data.templateName}
          </p>
          {(data.candidateName || data.roleName) && (
            <p className="mt-1.5 text-base font-medium" style={{ color: '#cbd5e1' }}>
              {data.candidateName}
              {data.candidateName && data.roleName && (
                <span style={{ color: '#475569' }}> · </span>
              )}
              {data.roleName}
            </p>
          )}
          <p className="mt-1 text-sm" style={{ color: '#475569' }}>
            {fmtDate(data.startedAt)}
          </p>
        </div>

        {/* ── Scorecard summary ───────────────────────────────────── */}
        {scorecard && (rec || scorecard.rating || scorecard.notes) && (
          <div
            className="mb-8 rounded-xl border p-5"
            style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
              Scorecard
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {scorecard.rating && (
                <span style={{ color: '#f59e0b', fontSize: 18, letterSpacing: 2 }}>
                  {'★'.repeat(scorecard.rating)}
                  <span style={{ color: '#1e3a5f' }}>{'★'.repeat(5 - scorecard.rating)}</span>
                </span>
              )}
              {rec && (
                <span
                  className="rounded-full px-3 py-1 text-sm font-semibold"
                  style={{ backgroundColor: rec.bg, color: rec.color }}
                >
                  {rec.label}
                </span>
              )}
            </div>
            {scorecard.notes && (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                {scorecard.notes}
              </p>
            )}
          </div>
        )}

        {/* ── Stats row ──────────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            {
              label: 'Planned',
              value: `${data.plannedDuration}m`,
              color: '#f1f5f9',
            },
            {
              label: 'Actual',
              value: fmtDuration(data.actualDuration),
              color: '#f1f5f9',
            },
            {
              label: 'Over / Under',
              value: diffLabel,
              color: diffColor,
            },
          ].map(card => (
            <div
              key={card.label}
              className="flex flex-col items-center rounded-xl border py-5"
              style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
                {card.label}
              </p>
              <p className="text-xl font-bold tabular-nums" style={{ color: card.color }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Section breakdown ───────────────────────────────────── */}
        {data.sections.length > 0 && (
          <div
            className="mb-8 overflow-hidden rounded-xl border"
            style={{ borderColor: '#1e3a5f', backgroundColor: '#111827' }}
          >
            {/* Table header */}
            <div
              className="grid grid-cols-4 gap-4 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wider"
              style={{ borderColor: '#1e3a5f', color: '#475569' }}
            >
              <span className="col-span-1">Section</span>
              <span className="text-right">Planned</span>
              <span className="text-right">Actual</span>
              <span className="text-right">Difference</span>
            </div>

            {/* Rows */}
            {data.sections.map((section, i) => {
              const diff = section.actualSeconds - section.plannedSeconds
              const rowColor = sectionRowColor(section)
              const { label: secDiff } = fmtDiff(diff)

              return (
                <div
                  key={section.id ?? i}
                  className={`grid grid-cols-4 gap-4 px-5 py-3.5 text-sm ${
                    i < data.sections.length - 1 ? 'border-b' : ''
                  }`}
                  style={{ borderColor: '#1e3a5f' }}
                >
                  <div className="col-span-1 flex items-center gap-2">
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: rowColor }}
                    />
                    <span className="font-medium">{section.name}</span>
                    {section.skipped && (
                      <span
                        className="rounded px-1.5 py-0.5 text-xs"
                        style={{ backgroundColor: '#1f2937', color: '#64748b' }}
                      >
                        Skipped
                      </span>
                    )}
                  </div>
                  <span className="text-right tabular-nums" style={{ color: '#94a3b8' }}>
                    {fmtDuration(section.plannedSeconds)}
                  </span>
                  <span className="text-right tabular-nums" style={{ color: '#94a3b8' }}>
                    {section.skipped ? '—' : fmtDuration(section.actualSeconds)}
                  </span>
                  <span className="text-right text-xs font-medium tabular-nums" style={{ color: rowColor }}>
                    {section.skipped ? '—' : secDiff}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Save status ─────────────────────────────────────────── */}
        {saveState === 'saved' && (
          <div
            className="mb-6 flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
            style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}
          >
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            Session saved to your account.
          </div>
        )}

        {saveState === 'error' && (
          <div
            className="mb-6 rounded-lg px-4 py-3 text-sm"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
          >
            Could not save this session — it will not appear in your history.
          </div>
        )}

        {saveState === 'guest' && (
          <div
            className="mb-6 rounded-xl border p-5"
            style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
          >
            <p className="mb-1 font-semibold">Save your session history</p>
            <p className="mb-4 text-sm" style={{ color: '#94a3b8' }}>
              Sign in to save this session and track your pacing over time.
            </p>
            <GuestSignInButton />
          </div>
        )}

        {saveState === 'saving' && (
          <p className="mb-6 text-sm" style={{ color: '#475569' }}>Saving session…</p>
        )}

        {/* ── Actions ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/session/${data.templateId}`}
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
            style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}
          >
            <RotateCcw className="h-4 w-4" />
            Run Again
          </Link>

          {!isDemo && saveState !== 'guest' && (
            <Link
              href={`/dashboard/templates/${data.templateId}/edit`}
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}
            >
              <Pencil className="h-4 w-4" />
              Edit Template
            </Link>
          )}

          {saveState !== 'guest' ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          ) : (
            <GuestSignInButton variant="subtle" />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Guest sign-in button ───────────────────────────────────────────────────

function GuestSignInButton({ variant = 'filled' }: { variant?: 'filled' | 'subtle' }) {
  function handleSignIn() {
    window.location.href = '/auth/signin'
  }

  if (variant === 'subtle') {
    return (
      <button
        onClick={handleSignIn}
        className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium"
        style={{ borderColor: '#1A56DB', color: '#3b82f6' }}
      >
        Sign in to save
      </button>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
      style={{ backgroundColor: '#1A56DB' }}
    >
      Sign in with Google
    </button>
  )
}
