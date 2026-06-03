'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2, Play, Link as LinkIcon, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Section = {
  id: string
  name: string
  duration_minutes: number
  order: number
}

type Template = {
  id: string
  name: string
  sections: Section[]
  total_duration: number | null
  created_at: string
  updated_at: string
}

type Props = {
  initialTemplates: Template[]
}

export default function TemplatesGrid({ initialTemplates }: Props) {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Start-session modal state
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)
  const [candidateName, setCandidateName] = useState('')
  const [roleName, setRoleName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  function openModal(template: Template) {
    setActiveTemplate(template)
    setCandidateName('')
    setRoleName('')
    setEmail('')
    setStartError(null)
  }

  function closeModal() {
    if (submitting) return
    setActiveTemplate(null)
  }

  async function handleStart() {
    if (!activeTemplate || !candidateName.trim() || !roleName.trim() || submitting) return
    setSubmitting(true)
    setStartError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/signin')
      return
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        template_id: activeTemplate.id,
        candidate_name: candidateName.trim(),
        role_name: roleName.trim(),
        candidate_email: email.trim() || null,
        started_at: new Date().toISOString(),
        planned_duration: activeTemplate.total_duration ?? 0,
        template_snapshot: {
          name: activeTemplate.name,
          sections: activeTemplate.sections,
        },
      })
      .select('id')
      .single()

    if (error || !session) {
      setStartError('Could not start session. Please try again.')
      setSubmitting(false)
      return
    }

    router.push(`/session/${session.id}`)
  }

  function handleCopyLink(id: string) {
    const origin = window.location.origin
    navigator.clipboard
      .writeText(`${origin}/session/${id}`)
      .then(() => {
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
      })
      .catch(() => {})
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('templates').delete().eq('id', id)
    if (error) {
      alert('Failed to delete template: ' + error.message)
      setDeletingId(null)
      return
    }
    setTemplates(prev => prev.filter(t => t.id !== id))
    setDeletingId(null)
  }

  const canSubmit = candidateName.trim() !== '' && roleName.trim() !== '' && !submitting

  if (templates.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border py-20 text-center"
        style={{ borderColor: 'var(--color-border)', borderStyle: 'dashed' }}
      >
        <div
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
          style={{ backgroundColor: 'var(--color-surface-2)' }}
        >
          📋
        </div>
        <p className="mb-1 text-base font-semibold">No templates yet</p>
        <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Create a template to start running structured interviews.
        </p>
        <Link
          href="/dashboard/templates/new"
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--color-brand)' }}
        >
          Create your first template
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* ── Start Session Modal ───────────────────────────────────── */}
      {activeTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(6px)' }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-7 shadow-2xl"
            style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
                  Starting session
                </p>
                <h2 className="text-lg font-bold leading-tight">{activeTemplate.name}</h2>
                <p className="mt-0.5 text-sm" style={{ color: '#64748b' }}>
                  {activeTemplate.sections?.length ?? 0} sections ·{' '}
                  {activeTemplate.total_duration ?? 0} min
                </p>
              </div>
              <button onClick={closeModal} className="rounded p-1" style={{ color: '#64748b' }}>
                <X className="h-4 w-4" />
              </button>
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

              {startError && (
                <p
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                >
                  {startError}
                </p>
              )}

              <div className="mt-1 flex items-center gap-3">
                <button
                  onClick={handleStart}
                  disabled={!canSubmit}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ backgroundColor: '#1A56DB' }}
                >
                  {submitting ? 'Starting…' : 'Start Interview'}
                </button>
                <button
                  onClick={closeModal}
                  className="text-sm"
                  style={{ color: '#475569' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Template cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {templates.map(template => {
          const sections = Array.isArray(template.sections) ? template.sections : []
          const sectionCount = sections.length
          const duration = template.total_duration ?? 0
          const isDeleting = deletingId === template.id

          return (
            <div
              key={template.id}
              className="flex flex-col rounded-xl border p-5 transition-opacity"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                opacity: isDeleting ? 0.4 : 1,
              }}
            >
              {/* Top row: name + action icons */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="flex-1 font-semibold leading-snug">{template.name}</h3>
                <div className="flex items-center gap-0.5">
                  {/* Copy session link */}
                  <div className="relative">
                    {copiedId === template.id && (
                      <div
                        className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs"
                        style={{ backgroundColor: '#1f2937', color: '#22c55e', zIndex: 10 }}
                      >
                        Copied!
                      </div>
                    )}
                    <button
                      onClick={() => handleCopyLink(template.id)}
                      className="rounded p-1.5 transition-colors"
                      style={{ color: 'var(--color-text-muted)' }}
                      title="Copy session link"
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Link
                    href={`/dashboard/templates/${template.id}/edit`}
                    className="rounded p-1.5 transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                    title="Edit template"
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(template.id, template.name)}
                    disabled={isDeleting}
                    className="rounded p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ color: 'var(--color-text-muted)' }}
                    title="Delete template"
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-red)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Meta */}
              <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{duration} min</span>
              </div>

              {/* Section list preview */}
              {sections.length > 0 && (
                <div className="mt-3 flex flex-col gap-1">
                  {sections.slice(0, 3).map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="truncate">{s.name || 'Unnamed'}</span>
                      <span className="ml-2 flex-shrink-0">{s.duration_minutes}m</span>
                    </div>
                  ))}
                  {sections.length > 3 && (
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      +{sections.length - 3} more
                    </p>
                  )}
                </div>
              )}

              {/* Start Session CTA */}
              <div className="mt-auto pt-5">
                <button
                  onClick={() => openModal(template)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: 'var(--color-brand)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-brand-light)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-brand)')}
                >
                  <Play className="h-3.5 w-3.5" />
                  Start Session
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
