'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

type CandidateSession = {
  id: string
  candidate_name: string | null
  role_name: string | null
  recommendation: string | null
  overall_rating: number | null
  started_at: string | null
}

type CandidateGroup = {
  name: string
  role: string
  latestSessionId: string
  latestDate: string | null
  recommendation: string | null
  rating: number | null
  count: number
}

const REC_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  strong_yes: { label: 'Strong Yes', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  yes:        { label: 'Yes',        color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  no:         { label: 'No',         color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  strong_no:  { label: 'Strong No',  color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          style={{
            fontSize: 13,
            color: n <= rating ? '#f59e0b' : '#334155',
          }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default function CandidatesTab({ sessions }: { sessions: CandidateSession[] }) {
  const [query, setQuery] = useState('')

  const candidates: CandidateGroup[] = useMemo(() => {
    const map = new Map<string, CandidateGroup>()
    for (const s of sessions) {
      if (!s.candidate_name) continue
      const key = `${s.candidate_name.toLowerCase()}|||${(s.role_name ?? '').toLowerCase()}`
      if (!map.has(key)) {
        map.set(key, {
          name: s.candidate_name,
          role: s.role_name ?? '',
          latestSessionId: s.id,
          latestDate: s.started_at,
          recommendation: s.recommendation,
          rating: s.overall_rating,
          count: 1,
        })
      } else {
        const existing = map.get(key)!
        existing.count++
        if (s.started_at && (!existing.latestDate || s.started_at > existing.latestDate)) {
          existing.latestSessionId = s.id
          existing.latestDate = s.started_at
          existing.recommendation = s.recommendation
          existing.rating = s.overall_rating
        }
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      (b.latestDate ?? '').localeCompare(a.latestDate ?? '')
    )
  }, [sessions])

  const filtered = useMemo(() => {
    if (!query.trim()) return candidates
    const q = query.toLowerCase()
    return candidates.filter(
      c => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q)
    )
  }, [candidates, query])

  if (sessions.filter(s => s.candidate_name).length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border py-20 text-center"
        style={{ borderColor: 'var(--color-border)', borderStyle: 'dashed' }}
      >
        <div className="mb-3 text-3xl">👥</div>
        <p className="mb-1 text-base font-semibold">No candidates yet</p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Start a session to track your first interview.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: 'var(--color-text-muted)' }}
        />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or role…"
          className="w-full rounded-lg border bg-transparent py-2.5 pl-9 pr-4 text-sm outline-none transition-colors"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No candidates match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => {
            const rec = c.recommendation ? REC_LABELS[c.recommendation] : null
            return (
              <div
                key={`${c.name}|||${c.role}`}
                className="flex flex-col rounded-xl border p-5"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <h3 className="text-base font-bold leading-tight">{c.name}</h3>
                {c.role && (
                  <span
                    className="mt-1 inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {c.role}
                  </span>
                )}

                <div className="mt-3 flex flex-col gap-1.5">
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Last interviewed {formatDate(c.latestDate)}
                    {c.count > 1 && ` · ${c.count} sessions`}
                  </p>
                  {c.rating && <StarDisplay rating={c.rating} />}
                  {rec && (
                    <span
                      className="inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: rec.bg, color: rec.color }}
                    >
                      {rec.label}
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-4">
                  <Link
                    href={`/dashboard/candidates/${c.latestSessionId}`}
                    className="flex w-full items-center justify-center rounded-lg py-2 text-sm font-medium transition-colors"
                    style={{
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-muted)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = 'var(--color-text)'
                      e.currentTarget.style.borderColor = 'var(--color-text-muted)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'var(--color-text-muted)'
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                    }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
