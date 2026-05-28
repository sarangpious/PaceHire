'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { GripVertical, Trash2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Section = {
  id: string
  name: string
  duration_minutes: number
  order: number
}

type Props = {
  templateId?: string
  initialName?: string
  initialDescription?: string
  initialSections?: Section[]
}

function makeSection(order: number): Section {
  return { id: crypto.randomUUID(), name: '', duration_minutes: 15, order }
}

const inputStyle: React.CSSProperties = {
  color: 'var(--color-text)',
  backgroundColor: 'transparent',
}

export default function TemplateBuilder({
  templateId,
  initialName = '',
  initialDescription = '',
  initialSections,
}: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [sections, setSections] = useState<Section[]>(
    initialSections ?? [makeSection(0), makeSection(1)]
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Drag state — dragIndex is a ref to avoid triggering re-renders on start
  const dragIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const totalMinutes = sections.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  // ── Section mutations ──────────────────────────────────────────────
  function addSection() {
    setSections(prev => [...prev, makeSection(prev.length)])
  }

  function updateSection(index: number, patch: Partial<Section>) {
    setSections(prev => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  function removeSection(index: number) {
    setSections(prev =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i }))
    )
  }

  // ── Drag handlers ──────────────────────────────────────────────────
  function handleDragStart(e: React.DragEvent<HTMLDivElement>, index: number) {
    dragIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
    // Minimal ghost — just the row text
    e.dataTransfer.setData('text/plain', String(index))
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) setDragOverIndex(index)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, dropIndex: number) {
    e.preventDefault()
    const from = dragIndexRef.current
    if (from === null || from === dropIndex) {
      dragIndexRef.current = null
      setDragOverIndex(null)
      return
    }
    const next = [...sections]
    const [moved] = next.splice(from, 1)
    next.splice(dropIndex, 0, moved)
    setSections(next.map((s, i) => ({ ...s, order: i })))
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  function handleDragEnd() {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  // ── Save ───────────────────────────────────────────────────────────
  async function handleSave() {
    setError(null)
    if (!name.trim()) { setError('Template must have a name.'); return }
    if (sections.length < 2) { setError('Add at least 2 sections.'); return }
    const badSection = sections.find(s => !s.name.trim() || s.duration_minutes < 1)
    if (badSection) {
      setError('Each section needs a name and a duration of at least 1 minute.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { setError('Not authenticated.'); setSaving(false); return }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      sections,
      total_duration: totalMinutes,
      user_id: user.id,
    }

    const { error: dbError } = templateId
      ? await supabase.from('templates').update(payload).eq('id', templateId).eq('user_id', user.id)
      : await supabase.from('templates').insert(payload)

    if (dbError) { setError(dbError.message); setSaving(false); return }

    router.push('/dashboard')
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
    >
      {/* ── Left panel: Builder ───────────────────────────────────── */}
      <div
        className="flex w-3/5 flex-col gap-7 border-r p-10"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold">
            {templateId ? 'Edit template' : 'New template'}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Define sections and time budgets for a structured interview.
          </p>
        </div>

        {/* Name + description */}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Template name..."
            className="w-full rounded-lg border px-4 py-3 text-xl font-semibold placeholder:font-normal placeholder:text-base focus:outline-none"
            style={{
              ...inputStyle,
              borderColor: 'var(--color-border)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          />
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none"
            style={{
              ...inputStyle,
              borderColor: 'var(--color-border)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {/* Section list */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Sections
          </p>

          {/* Column headers */}
          <div className="flex items-center gap-3 px-3 pb-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span className="w-4" />
            <span className="flex-1">Name</span>
            <span className="w-20 text-center">Duration</span>
            <span className="w-6" />
          </div>

          <div className="flex flex-col gap-2">
            {sections.map((section, index) => {
              const isDragging = dragIndexRef.current === index
              const isOver = dragOverIndex === index && dragIndexRef.current !== index
              return (
                <div
                  key={section.id}
                  draggable
                  onDragStart={e => handleDragStart(e, index)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDrop={e => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all"
                  style={{
                    backgroundColor: isOver ? 'var(--color-surface-2)' : 'var(--color-surface)',
                    borderColor: isOver ? 'var(--color-brand)' : 'var(--color-border)',
                    opacity: isDragging ? 0.35 : 1,
                  }}
                >
                  {/* Drag handle */}
                  <GripVertical
                    className="h-4 w-4 flex-shrink-0 cursor-grab active:cursor-grabbing"
                    style={{ color: 'var(--color-text-muted)' }}
                  />

                  {/* Section name */}
                  <input
                    type="text"
                    value={section.name}
                    onChange={e => updateSection(index, { name: e.target.value })}
                    placeholder={`Section ${index + 1}`}
                    className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
                    style={{ color: 'var(--color-text)' }}
                    // Prevent drag ghost from stealing focus when clicking into input
                    onMouseDown={e => e.stopPropagation()}
                  />

                  {/* Duration */}
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <input
                      type="number"
                      value={section.duration_minutes}
                      min={1}
                      max={120}
                      onChange={e => {
                        const val = parseInt(e.target.value)
                        updateSection(index, { duration_minutes: isNaN(val) ? 1 : Math.max(1, val) })
                      }}
                      className="w-14 rounded border bg-transparent px-2 py-1 text-center text-sm focus:outline-none"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                      onMouseDown={e => e.stopPropagation()}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                    />
                    <span className="w-6 text-xs" style={{ color: 'var(--color-text-muted)' }}>min</span>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeSection(index)}
                    className="flex-shrink-0 rounded p-1 transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-red)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Add section */}
          <button
            onClick={addSection}
            className="mt-1 flex items-center gap-2 rounded-lg border border-dashed px-4 py-2.5 text-sm transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-brand)'
              e.currentTarget.style.color = 'var(--color-brand)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.color = 'var(--color-text-muted)'
            }}
          >
            <Plus className="h-4 w-4" />
            Add section
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--color-red)',
            }}
          >
            {error}
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="self-start rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-brand)' }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = 'var(--color-brand-light)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-brand)' }}
        >
          {saving ? 'Saving…' : 'Save Template'}
        </button>
      </div>

      {/* ── Right panel: Live preview ─────────────────────────────── */}
      <div className="flex w-2/5 flex-col gap-6 p-10">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Preview
        </p>

        <div>
          <h2
            className="text-xl font-bold"
            style={{ color: name.trim() ? 'var(--color-text)' : 'var(--color-text-muted)' }}
          >
            {name.trim() || 'Untitled template'}
          </h2>
          {description.trim() && (
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {description}
            </p>
          )}
        </div>

        {totalMinutes > 0 ? (
          <div className="flex flex-col gap-4">
            {sections.map(section => {
              const pct = (section.duration_minutes / totalMinutes) * 100
              return (
                <div key={section.id}>
                  <div
                    className="mb-1.5 flex items-center justify-between text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                      {section.name.trim() || 'Unnamed'}
                    </span>
                    <span>{section.duration_minutes}m</span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: 'var(--color-surface-2)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: 'var(--color-brand)' }}
                    />
                  </div>
                </div>
              )
            })}

            <div
              className="flex items-center justify-between border-t pt-4 text-sm"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span style={{ color: 'var(--color-text-muted)' }}>Total</span>
              <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {totalMinutes} minutes
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Add sections to see the timeline.
          </p>
        )}
      </div>
    </div>
  )
}
