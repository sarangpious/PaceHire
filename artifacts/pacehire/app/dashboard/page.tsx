import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DashboardHeader from './_components/DashboardHeader'
import TemplatesGrid from './_components/TemplatesGrid'

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

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [profileRes, templatesRes, sessionsRes] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url, email').eq('id', user.id).single(),
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

  const profile = profileRes.data
  const templates = templatesRes.data ?? []
  const sessions = sessionsRes.data ?? []

  const firstName =
    profile?.full_name?.split(' ')[0] ||
    user.email?.split('@')[0] ||
    'there'

  return (
    <div className="animate-page-in" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh' }}>
      <DashboardHeader
        email={profile?.email ?? user.email ?? ''}
        avatarUrl={profile?.avatar_url ?? null}
        fullName={profile?.full_name ?? null}
      />

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Welcome */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {firstName}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Your interview templates
            </p>
          </div>
          <Link
            href="/dashboard/templates/new"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            + New Template
          </Link>
        </div>

        {/* Templates */}
        <TemplatesGrid initialTemplates={templates} />

        {/* Recent Sessions */}
        <section className="mt-14">
          <h2 className="mb-4 text-base font-semibold">Recent Sessions</h2>

          {sessions.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No sessions yet. Start an interview to see your history here.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {sessions.map(session => {
                const name =
                  (session.template_snapshot as { name?: string } | null)?.name ??
                  'Unknown template'
                const date = session.started_at ? formatDate(session.started_at) : '—'
                const planned = session.planned_duration ? `${session.planned_duration}m planned` : null
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
                        {planned && actual ? ` · ${planned} / ${actual}` : planned ? ` · ${planned}` : ''}
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
      </main>
    </div>
  )
}
