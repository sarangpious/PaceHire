import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SessionScreen from './_components/SessionScreen'
import StartSessionPage from './_components/StartSessionPage'

const DEMO_TEMPLATE = {
  id: 'demo',
  name: 'Engineering Interview — 45 min',
  sections: [
    { id: 'demo-1', name: 'Introduction',        duration_minutes: 5,  order: 0 },
    { id: 'demo-2', name: 'Resume Discussion',   duration_minutes: 10, order: 1 },
    { id: 'demo-3', name: 'Technical Questions', duration_minutes: 20, order: 2 },
    { id: 'demo-4', name: 'Candidate Questions', duration_minutes: 5,  order: 3 },
    { id: 'demo-5', name: 'Wrap-Up',             duration_minutes: 5,  order: 4 },
  ],
  total_duration: 45,
}

interface Props {
  params: { templateId: string }
}

type TemplateRow = {
  id: string
  name: string
  sections: { id: string; name: string; duration_minutes: number; order: number }[]
  total_duration: number | null
}

export default async function SessionPage({ params }: Props) {
  // 1. Demo shortcut
  if (params.templateId === 'demo') {
    return <SessionScreen template={DEMO_TEMPLATE} sessionId={null} candidateInfo={null} />
  }

  const supabase = await createClient()

  // 2. Try loading as a pre-created session record
  const { data: sessionRow } = await supabase
    .from('sessions')
    .select('id, template_id, candidate_name, role_name, templates(id, name, sections, total_duration)')
    .eq('id', params.templateId)
    .maybeSingle()

  if (sessionRow) {
    const raw = sessionRow.templates
    const tpl = (Array.isArray(raw) ? raw[0] : raw) as TemplateRow | null
    if (!tpl) notFound()
    return (
      <SessionScreen
        template={tpl}
        sessionId={sessionRow.id}
        candidateInfo={
          sessionRow.candidate_name
            ? { name: sessionRow.candidate_name, role: sessionRow.role_name ?? '' }
            : null
        }
      />
    )
  }

  // 3. Try as a template ID (direct/shared link → show start-session form)
  const { data: template } = await supabase
    .from('templates')
    .select('id, name, sections, total_duration')
    .eq('id', params.templateId)
    .single()

  if (!template) notFound()

  return <StartSessionPage template={template as TemplateRow} />
}
