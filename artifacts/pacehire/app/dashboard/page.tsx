import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DashboardHeader from './_components/DashboardHeader'
import TemplatesGrid from './_components/TemplatesGrid'
import TabBar from './_components/TabBar'
import CandidatesTab from './_components/CandidatesTab'
import RolesTab from './_components/RolesTab'

type Tab = 'templates' | 'candidates' | 'roles'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const tab = (searchParams.tab ?? 'templates') as Tab
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Always fetch profile
  const profileRes = await supabase
    .from('profiles')
    .select('full_name, avatar_url, email')
    .eq('id', user.id)
    .single()

  const profile = profileRes.data
  const firstName =
    profile?.full_name?.split(' ')[0] ||
    user.email?.split('@')[0] ||
    'there'

  // Tab-specific data fetching
  let templates: {
    id: string; name: string; sections: unknown; total_duration: number | null;
    created_at: string; updated_at: string
  }[] = []
  let recentSessions: {
    id: string; template_snapshot: unknown; started_at: string | null;
    planned_duration: number | null; actual_duration: number | null
  }[] = []
  let candidateSessions: {
    id: string; candidate_name: string | null; role_name: string | null;
    recommendation: string | null; overall_rating: number | null;
    started_at: string | null; actual_duration: number | null;
    template_snapshot: { name?: string } | null
  }[] = []

  if (tab === 'templates') {
    const [tRes, sRes] = await Promise.all([
      supabase
        .from('templates')
        .select('id, name, sections, total_duration, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('sessions')
        .select('id, template_snapshot, started_at, planned_duration, actual_duration')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ])
    templates = (tRes.data ?? []) as typeof templates
    recentSessions = (sRes.data ?? []) as typeof recentSessions
  } else {
    // Candidates and Roles both need session data
    const sRes = await supabase
      .from('sessions')
      .select('id, candidate_name, role_name, recommendation, overall_rating, started_at, actual_duration, template_snapshot')
      .eq('user_id', user.id)
      .not('candidate_name', 'is', null)
      .order('started_at', { ascending: false })
    candidateSessions = (sRes.data ?? []) as typeof candidateSessions
  }

  return (
    <div
      className="animate-page-in"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh' }}
    >
      <DashboardHeader
        email={profile?.email ?? user.email ?? ''}
        avatarUrl={profile?.avatar_url ?? null}
        fullName={profile?.full_name ?? null}
      />

      <main className="mx-auto max-w-6xl px-6">
        {/* Welcome row */}
        <div className="flex items-end justify-between py-8">
          <div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {firstName}
            </h1>
          </div>
          {tab === 'templates' && (
            <Link
              href="/dashboard/templates/new"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              + New Template
            </Link>
          )}
        </div>

        {/* Tab bar */}
        <TabBar activeTab={tab} />

        {/* Tab content */}
        <div className="py-8">

          {/* ── Templates tab ─────────────────────────────────────── */}
          {tab === 'templates' && (
            <>
              <TemplatesGrid initialTemplates={templates as Parameters<typeof TemplatesGrid>[0]['initialTemplates']} />

              {/* Recent Sessions */}
              <section className="mt-14">
                <h2 className="mb-4 text-base font-semibold">Recent Sessions</h2>

                {recentSessions.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    No sessions yet. Start an interview to see your history here.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {recentSessions.map(session => {
                      const name =
                        (session.template_snapshot as { name?: string } | null)?.name ??
                        'Unknown template'
                      const date = session.started_at ? formatDate(session.started_at) : '—'
                      const planned = session.planned_duration
                        ? `${session.planned_duration}m planned`
                        : null
                      const actual =
                        session.actual_duration != null
                          ? `${Math.round(session.actual_duration / 60)}m actual`
                          : null

                      return (
                        <div
                          key={session.id}
                          className="flex items-center justify-between rounded-lg border px-4 py-3"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            borderColor: 'var(--color-border)',
                          }}
                        >
                          <div>
                            <p className="text-sm font-medium">{name}</p>
                            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              {date}
                              {planned && actual
                                ? ` · ${planned} / ${actual}`
                                : planned
                                ? ` · ${planned}`
                                : ''}
                            </p>
                          </div>
                          <Link
                            href={`/session/${session.id}/summary`}
                            className="text-xs font-medium"
                            style={{ color: 'var(--color-brand)' }}
                          >
                            View Summary →
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {/* ── Candidates tab ────────────────────────────────────── */}
          {tab === 'candidates' && (
            <CandidatesTab sessions={candidateSessions} />
          )}

          {/* ── Roles tab ─────────────────────────────────────────── */}
          {tab === 'roles' && (
            <RolesTab sessions={candidateSessions} />
          )}

        </div>
      </main>
    </div>
  )
}
