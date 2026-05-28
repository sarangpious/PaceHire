import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TemplateBuilder from '../../_components/TemplateBuilder'

interface Props {
  params: { id: string }
}

export default async function EditTemplatePage({ params }: Props) {
  const supabase = await createClient()

  const { data: template, error } = await supabase
    .from('templates')
    .select('id, name, description, sections')
    .eq('id', params.id)
    .single()

  if (error || !template) {
    notFound()
  }

  return (
    <TemplateBuilder
      templateId={template.id}
      initialName={template.name ?? ''}
      initialDescription={template.description ?? ''}
      initialSections={template.sections ?? []}
    />
  )
}
