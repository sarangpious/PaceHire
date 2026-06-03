'use client'

import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  sessionId: string
  initialNotes: string
}

export default function CandidateDetailClient({ sessionId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialNotes)
  const [saving, setSaving] = useState(false)

  async function saveNotes() {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('sessions')
      .update({ post_session_notes: draft.trim() || null })
      .eq('id', sessionId)
    setNotes(draft)
    setEditing(false)
    setSaving(false)
  }

  function cancelEdit() {
    setDraft(notes)
    setEditing(false)
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
          Notes
        </p>
        {!editing && (
          <button
            onClick={() => { setDraft(notes); setEditing(true) }}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors"
            style={{ color: '#475569' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={4}
            autoFocus
            className="w-full resize-y rounded-lg border bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none"
            style={{ borderColor: '#3b82f6', color: '#f1f5f9', minHeight: 80 }}
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={saveNotes}
              disabled={saving}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: '#1A56DB' }}
            >
              <Check className="h-3 w-3" />
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={cancelEdit}
              disabled={saving}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs"
              style={{ color: '#64748b' }}
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p
          className="text-sm leading-relaxed"
          style={{ color: notes ? 'var(--color-text-muted)' : '#334155' }}
        >
          {notes || <em style={{ color: '#334155' }}>No notes recorded.</em>}
        </p>
      )}
    </div>
  )
}
