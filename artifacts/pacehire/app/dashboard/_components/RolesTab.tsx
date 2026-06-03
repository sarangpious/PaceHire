'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'

type RoleSession = {
  id: string
  candidate_name: string | null
  role_name: string | null
  recommendation: string | null
  overall_rating: number | null
  started_at: string | null
  actual_duration: number | null
  template_snapshot: { name?: string } | null
}

const REC_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  strong_yes: { label: 'Strong Yes', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  yes:        { label: 'Yes',        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  no:         { label: 'No',         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  strong_no:  { label: 'Strong No',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return <span style={{ color: '#475569' }}>—</span>
  return (
    <span style={{ color: '#f59e0b', letterSpacing: 1 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

function ComparisonModal({
  role,
  sessions,
  onClose,
}: {
  role: string
  sessions: RoleSession[]
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[80vh] overflow-auto rounded-2xl border shadow-2xl"
        style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: '#1e3a5f' }}>
          <h2 className="font-bold">{role} — Candidate Comparison</h2>
          <button onClick={onClose} className="text-sm" style={{ color: '#64748b' }}>✕</button>
        </div>

        <div className="grid gap-px overflow-hidden" style={{ gridTemplateColumns: `repeat(${sessions.length}, 1fr)`, backgroundColor: '#1e3a5f' }}>
          {sessions.map(s => {
            const rec = s.recommendation ? REC_LABELS[s.recommendation] : null
            return (
              <div key={s.id} className="p-5" style={{ backgroundColor: '#111827' }}>
                <p className="font-bold">{s.candidate_name ?? '—'}</p>
                <p className="mt-1 text-xs" style={{ color: '#64748b' }}>{formatDate(s.started_at)}</p>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <div>
                    <span style={{ color: '#475569' }}>Rating </span>
                    <StarDisplay rating={s.overall_rating} />
                  </div>
                  {rec && (
                    <span
                      className="inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: rec.bg, color: rec.color }}
                    >
                      {rec.label}
                    </span>
                  )}
                  <div>
                    <span style={{ color: '#475569' }}>Duration </span>
                    {formatDuration(s.actual_duration)}
                  </div>
                </div>
                <Link
                  href={`/dashboard/candidates/${s.id}`}
                  className="mt-3 block text-xs"
                  style={{ color: '#3b82f6' }}
                >
                  View full details →
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function RolesTab({ sessions }: { sessions: RoleSession[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [comparing, setComparing] = useState<string | null>(null)

  const roles = useMemo(() => {
    const map = new Map<string, RoleSession[]>()
    for (const s of sessions) {
      const role = s.role_name ?? 'Unknown Role'
      if (!map.has(role)) map.set(role, [])
      map.get(role)!.push(s)
    }
    return Array.from(map.entries())
      .map(([role, rows]) => ({
        role,
        rows: rows.sort((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? '')),
      }))
      .sort((a, b) => a.role.localeCompare(b.role))
  }, [sessions])

  if (sessions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border py-20 text-center"
        style={{ borderColor: 'var(--color-border)', borderStyle: 'dashed' }}
      >
        <div className="mb-3 text-3xl">📊</div>
        <p className="mb-1 text-base font-semibold">No roles yet</p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Candidate roles will appear here after your first session.
        </p>
      </div>
    )
  }

  const comparingSessions = comparing
    ? (roles.find(r => r.role === comparing)?.rows ?? [])
    : []

  return (
    <>
      {comparing && (
        <ComparisonModal
          role={comparing}
          sessions={comparingSessions}
          onClose={() => setComparing(null)}
        />
      )}

      <div className="flex flex-col gap-3">
        {roles.map(({ role, rows }) => {
          const isOpen = open[role] ?? false
          return (
            <div
              key={role}
              className="overflow-hidden rounded-xl border"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              {/* Role header */}
              <button
                onClick={() => setOpen(prev => ({ ...prev, [role]: !prev[role] }))}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                  ) : (
                    <ChevronRight className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                  )}
                  <span className="font-semibold">{role}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
                  >
                    {rows.length} candidate{rows.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {rows.length >= 2 && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setComparing(role)
                    }}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                  >
                    Compare
                  </button>
                )}
              </button>

              {/* Table */}
              {isOpen && (
                <div className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className="border-b text-xs font-semibold uppercase tracking-wider"
                        style={{ borderColor: 'var(--color-border)', color: '#475569' }}
                      >
                        <th className="px-5 py-2.5 text-left">Candidate</th>
                        <th className="px-3 py-2.5 text-left">Date</th>
                        <th className="px-3 py-2.5 text-left">Duration</th>
                        <th className="px-3 py-2.5 text-left">Recommendation</th>
                        <th className="px-3 py-2.5 text-left">Rating</th>
                        <th className="px-3 py-2.5 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((s, i) => {
                        const rec = s.recommendation ? REC_LABELS[s.recommendation] : null
                        return (
                          <tr
                            key={s.id}
                            className={i < rows.length - 1 ? 'border-b' : ''}
                            style={{ borderColor: 'var(--color-border)' }}
                          >
                            <td className="px-5 py-3 font-medium">{s.candidate_name ?? '—'}</td>
                            <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                              {formatDate(s.started_at)}
                            </td>
                            <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                              {formatDuration(s.actual_duration)}
                            </td>
                            <td className="px-3 py-3">
                              {rec ? (
                                <span
                                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                  style={{ backgroundColor: rec.bg, color: rec.color }}
                                >
                                  {rec.label}
                                </span>
                              ) : (
                                <span style={{ color: '#475569' }}>—</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-sm">
                              <StarDisplay rating={s.overall_rating} />
                            </td>
                            <td className="px-3 py-3">
                              <Link
                                href={`/dashboard/candidates/${s.id}`}
                                className="text-xs font-medium"
                                style={{ color: 'var(--color-brand)' }}
                              >
                                Details →
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
