import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SessionScreen from './_components/SessionScreen'

const DEMO_TEMPLATE = {
  id: 'demo',
  name: 'Engineering Interview — 45 min',
  sections: [
    { id: 'demo-1', name: 'Introduction', duration_minutes: 5, order: 0 },
    { id: 'demo-2', name: 'Resume Discussion', duration_minutes: 10, order: 1 },
    { id: 'demo-3', name: 'Technical Questions', duration_minutes: 20, order: 2 },
    { id: 'demo-4', name: 'Candidate Questions', duration_minutes: 5, order: 3 },
    { id: 'demo-5', name: 'Wrap-Up', duration_minutes: 5, order: 4 },
  ],
  total_duration: 45,
}

interface Props {
  params: { templateId: string }
}

export default async function SessionPage({ params }: Props) {
  if (params.templateId === 'demo') {
    return <SessionScreen template={DEMO_TEMPLATE} />
  }

  const supabase = await createClient()
  const { data: template } = await supabase
    .from('templates')
    .select('id, name, sections, total_duration')
    .eq('id', params.templateId)
    .single()

  if (!template) notFound()

  return <SessionScreen template={template} />
}
