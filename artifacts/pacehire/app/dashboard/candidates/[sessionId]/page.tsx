import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DashboardHeader from '@/app/dashboard/_components/DashboardHeader'
import CandidateDetailClient from './_components/CandidateDetailClient'
import PrintButton from './_components/PrintButton'

type Session = {
  id: string
  candidate_name: string | null
  role_name: string | null
  candidate_email: string | null
  overall_rating: number | null
  recommendation: string | null
  post_session_notes: string | null
  started_at: string | null
  ended_at: string | null
  actual_duration: number | null
  planned_duration: number | null
  template_snapshot: { name?: string; sections?: unknown[] } | null
  section_results: {
    id?: string; name: string; plannedSeconds: number; actualSeconds: number; skipped: boolean
  }[] | null
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

const REC_LABELS: Record<string, { label: string; color: string }> = {
  strong_yes: { label: 'Strong Yes', color: '#22c55e' },
  yes:        { label: 'Yes',        color: '#3b82f6' },
  no:         { label: 'No',         color: '#f59e0b' },
  strong_no:  { label: 'Strong No',  color: '#ef4444' },
}

export default async function CandidateDetailPage({
  params,
}: {
  params: { sessionId: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profileRes = await supabase
    .from('profiles')
    .select('full_name, avatar_url, email')
    .eq('id', user.id)
    .single()

  // Load the anchor session to get candidate info
  const { data: anchor } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.sessionId)
    .eq('user_id', user.id)
    .single()

  if (!anchor) notFound()

  const candidateName = anchor.candidate_name as string | null
  if (!candidateName) notFound()

  // Load all sessions for this candidate
  const { data: allSessions } = await supabase
    .from('sessions')
    .select('id, candidate_name, role_name, candidate_email, overall_rating, recommendation, post_session_notes, started_at, ended_at, actual_duration, planned_duration, template_snapshot, section_results')
    .eq('user_id', user.id)
    .eq('candidate_name', candidateName)
    .order('started_at', { ascending: false })

  const sessions = (allSessions ?? []) as Session[]
  const profile = profileRes.data

  const roleName = anchor.role_name as string | null
  const candidateEmail = anchor.candidate_email as string | null

  return (
    <div
      className="min-h-screen print:bg-white"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
    >
      <div className="print:hidden">
        <DashboardHeader
          email={profile?.email ?? user.email ?? ''}
          avatarUrl={profile?.avatar_url ?? null}
          fullName={profile?.full_name ?? null}
        />
      </div>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Back link */}
        <div className="mb-6 print:hidden">
          <Link
            href="/dashboard?tab=candidates"
            className="text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ← Back to Candidates
          </Link>
        </div>

        {/* Candidate header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{candidateName}</h1>
            {roleName && (
              <p className="mt-1 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                {roleName}
              </p>
            )}
            {candidateEmail && (
              <p className="mt-1 text-sm" style={{ color: '#475569' }}>
                {candidateEmail}
              </p>
            )}
          </div>

          <PrintButton />
        </div>

        {/* Sessions timeline */}
        <div className="flex flex-col gap-6">
          {sessions.map((session, idx) => {
            const rec = session.recommendation ? REC_LABELS[session.recommendation] : null
            const templateName = session.template_snapshot?.name ?? '—'

            return (
              <div
                key={session.id}
                className="rounded-xl border"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                {/* Session header */}
                <div
                  className="flex items-start justify-between gap-4 border-b px-5 py-4"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
                      Session {sessions.length - idx}
                    </p>
                    <p className="mt-0.5 font-semibold">{templateName}</p>
                    <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDate(session.started_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {rec && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ color: rec.color, backgroundColor: `${rec.color}20` }}
                      >
                        {rec.label}
                      </span>
                    )}
                    {session.overall_rating && (
                      <span style={{ color: '#f59e0b', fontSize: 13 }}>
                        {'★'.repeat(session.overall_rating)}
                        {'☆'.repeat(5 - session.overall_rating)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Session meta */}
                <div className="px-5 py-4">
                  <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {session.planned_duration && (
                      <span>Planned: {session.planned_duration}m</span>
                    )}
                    {session.actual_duration && (
                      <span>Actual: {formatDuration(session.actual_duration)}</span>
                    )}
                  </div>

                  {/* Section results */}
                  {Array.isArray(session.section_results) && session.section_results.length > 0 && (
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
                        Pacing
                      </p>
                      <div className="flex flex-col gap-1">
                        {session.section_results.map((s, si) => {
                          const diff = s.actualSeconds - s.plannedSeconds
                          const color = s.skipped
                            ? '#475569'
                            : diff <= 0 ? '#22c55e' : diff <= 120 ? '#f59e0b' : '#ef4444'
                          return (
                            <div key={si} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                <span>{s.name}</span>
                                {s.skipped && (
                                  <span className="rounded px-1.5 py-0.5" style={{ backgroundColor: '#1f2937', color: '#64748b' }}>
                                    Skipped
                                  </span>
                                )}
                              </div>
                              <span style={{ color: color }}>
                                {s.skipped ? '—' : `${Math.floor(s.actualSeconds / 60)}m`}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Notes — editable */}
                  <CandidateDetailClient
                    sessionId={session.id}
                    initialNotes={session.post_session_notes ?? ''}
                  />

                  <div className="mt-3">
                    <Link
                      href={`/session/${session.id}/summary`}
                      className="text-xs font-medium"
                      style={{ color: 'var(--color-brand)' }}
                    >
                      Full Summary →
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body { background: white !important; color: #111 !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
