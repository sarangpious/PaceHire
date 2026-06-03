'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Recommendation = 'strong_yes' | 'yes' | 'no' | 'strong_no'

type SessionRow = {
  id: string
  candidate_name: string | null
  role_name: string | null
  template_snapshot: { name?: string } | null
}

type TimingData = {
  templateName: string
  plannedDuration: number
  actualDuration: number
  startedAt: string
  sections: unknown[]
}

function readTiming(): TimingData | null {
  try {
    const raw = sessionStorage.getItem('pacehire_session_result')
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

const RECOMMENDATIONS: {
  key: Recommendation
  label: string
  color: string
  bg: string
  activeBg: string
}[] = [
  { key: 'strong_yes', label: 'Strong Yes', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', activeBg: 'rgba(34,197,94,0.2)' },
  { key: 'yes',        label: 'Yes',         color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', activeBg: 'rgba(59,130,246,0.2)' },
  { key: 'no',         label: 'No',          color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', activeBg: 'rgba(245,158,11,0.2)' },
  { key: 'strong_no',  label: 'Strong No',   color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  activeBg: 'rgba(239,68,68,0.2)' },
]

export default function ScorecardPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.templateId as string

  const [session, setSession] = useState<SessionRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('sessions')
        .select('id, candidate_name, role_name, template_snapshot')
        .eq('id', sessionId)
        .single()
      setSession(data)
      setLoading(false)
    })()
  }, [sessionId])

  async function save(includeScorecard: boolean) {
    setSaving(true)
    const supabase = createClient()
    const timing = readTiming()

    const patch: Record<string, unknown> = {
      ended_at: new Date().toISOString(),
    }

    if (timing) {
      patch.actual_duration = timing.actualDuration
      patch.section_results = timing.sections
      patch.template_snapshot = {
        name: timing.templateName,
        sections: timing.sections,
      }
    }

    if (includeScorecard) {
      patch.overall_rating = rating || null
      patch.recommendation = recommendation
      patch.post_session_notes = notes.trim() || null
    }

    await supabase.from('sessions').update(patch).eq('id', sessionId)

    try { sessionStorage.removeItem('pacehire_session_result') } catch {}

    router.push(`/session/${sessionId}/summary`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#0a0f1e' }}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#1A56DB', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const candidateName = session?.candidate_name ?? 'Candidate'
  const roleName = session?.role_name ?? ''

  const displayRating = hoverRating || rating

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0f1e', color: '#f1f5f9' }}>
      <div className="mx-auto max-w-xl px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold">How did the interview go?</h1>
          <p className="mt-2 text-base font-medium" style={{ color: '#94a3b8' }}>
            {candidateName}
            {roleName && (
              <span style={{ color: '#475569' }}> · {roleName}</span>
            )}
          </p>
        </div>

        {/* ── Overall rating ─────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
            Overall Rating
          </h2>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                className="rounded p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className="h-8 w-8"
                  style={{
                    fill: n <= displayRating ? '#f59e0b' : 'none',
                    color: n <= displayRating ? '#f59e0b' : '#334155',
                    transition: 'fill 0.1s, color 0.1s',
                  }}
                />
              </button>
            ))}
            {rating > 0 && (
              <button
                onClick={() => setRating(0)}
                className="ml-2 text-xs"
                style={{ color: '#475569' }}
              >
                Clear
              </button>
            )}
          </div>
        </section>

        {/* ── Recommendation ─────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
            Recommendation
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {RECOMMENDATIONS.map(rec => {
              const isSelected = recommendation === rec.key
              return (
                <button
                  key={rec.key}
                  onClick={() => setRecommendation(rec.key)}
                  className="rounded-xl border-2 px-4 py-4 text-base font-semibold transition-all"
                  style={{
                    borderColor: isSelected ? rec.color : `${rec.color}40`,
                    backgroundColor: isSelected ? rec.activeBg : rec.bg,
                    color: rec.color,
                  }}
                >
                  {rec.label}
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Notes ──────────────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
            Notes
          </h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Key observations, strengths, red flags, follow-up questions…"
            rows={5}
            className="w-full resize-y rounded-xl border bg-transparent px-4 py-3 text-sm leading-relaxed outline-none transition-colors"
            style={{
              borderColor: '#1e3a5f',
              color: '#f1f5f9',
              minHeight: 120,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
            onBlur={e => (e.currentTarget.style.borderColor = '#1e3a5f')}
          />
        </section>

        {/* ── Actions ────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => save(true)}
            disabled={!recommendation || saving}
            className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: saving ? '#1e3a5f' : '#1A56DB' }}
          >
            {saving ? 'Saving…' : 'Save & View Summary'}
          </button>
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="text-sm"
            style={{ color: '#475569' }}
          >
            Skip for now
          </button>
        </div>

      </div>
    </div>
  )
}
