'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Template = {
  id: string
  name: string
  sections: { id: string; name: string; duration_minutes: number; order: number }[]
  total_duration: number | null
}

export default function StartSessionPage({ template }: { template: Template }) {
  const router = useRouter()
  const [candidateName, setCandidateName] = useState('')
  const [roleName, setRoleName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = candidateName.trim() !== '' && roleName.trim() !== '' && !submitting

  async function handleStart() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/signin')
      return
    }

    const { data: session, error: err } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        template_id: template.id,
        candidate_name: candidateName.trim(),
        role_name: roleName.trim(),
        candidate_email: email.trim() || null,
        started_at: new Date().toISOString(),
        planned_duration: template.total_duration ?? 0,
        template_snapshot: { name: template.name, sections: template.sections },
      })
      .select('id')
      .single()

    if (err || !session) {
      setError('Could not start session. Please try again.')
      setSubmitting(false)
      return
    }

    router.push(`/session/${session.id}`)
  }

  const sectionCount = template.sections?.length ?? 0
  const duration = template.total_duration ?? 0

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{ backgroundColor: '#0a0f1e', color: '#f1f5f9' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-8 shadow-2xl"
        style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
      >
        {/* Template info */}
        <div className="mb-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
            Starting session
          </p>
          <h1 className="text-xl font-bold">{template.name}</h1>
          <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
            {sectionCount} section{sectionCount !== 1 ? 's' : ''} · {duration} min
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Candidate name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: '#94a3b8' }}>
              Candidate name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors"
              style={{ borderColor: '#1e3a5f', color: '#f1f5f9' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#1e3a5f')}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleStart()}
            />
          </div>

          {/* Role */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: '#94a3b8' }}>
              Role <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors"
              style={{ borderColor: '#1e3a5f', color: '#f1f5f9' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#1e3a5f')}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
            />
          </div>

          {/* Email (optional) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: '#94a3b8' }}>
              Email <span style={{ color: '#475569' }}>(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="optional — for your records"
              className="w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors"
              style={{ borderColor: '#1e3a5f', color: '#f1f5f9' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#1e3a5f')}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
            />
          </div>

          {error && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              {error}
            </p>
          )}

          <button
            onClick={handleStart}
            disabled={!canSubmit}
            className="mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: '#1A56DB' }}
          >
            {submitting ? 'Starting…' : 'Start Interview'}
          </button>
        </div>
      </div>
    </div>
  )
}
