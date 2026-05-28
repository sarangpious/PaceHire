'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Play } from 'lucide-react'
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
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
                <Link
                  href={`/dashboard/templates/${template.id}/edit`}
                  className="rounded p-1.5 transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                  title="Edit template"
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
                  onMouseLeave={e =>
                    (e.currentTarget.style.color = 'var(--color-text-muted)')
                  }
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => handleDelete(template.id, template.name)}
                  disabled={isDeleting}
                  className="rounded p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ color: 'var(--color-text-muted)' }}
                  title="Delete template"
                  onMouseEnter={e =>
                    (e.currentTarget.style.color = 'var(--color-red)')
                  }
                  onMouseLeave={e =>
                    (e.currentTarget.style.color = 'var(--color-text-muted)')
                  }
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
              <Link
                href={`/session/${template.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: 'var(--color-brand)' }}
                onMouseEnter={e =>
                  (e.currentTarget.style.backgroundColor = 'var(--color-brand-light)')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.backgroundColor = 'var(--color-brand)')
                }
              >
                <Play className="h-3.5 w-3.5" />
                Start Session
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
