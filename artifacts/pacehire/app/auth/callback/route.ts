import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://a8f9dcf2-b670-42fe-9851-a94a06d61268-00-gko79s5rzbvn.sisko.replit.dev'
      return NextResponse.redirect(`${siteUrl}${next}`)
    }

    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://a8f9dcf2-b670-42fe-9851-a94a06d61268-00-gko79s5rzbvn.sisko.replit.dev'
    return NextResponse.redirect(`${siteUrl}/?error=auth&detail=${encodeURIComponent(error.message)}`)
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://a8f9dcf2-b670-42fe-9851-a94a06d61268-00-gko79s5rzbvn.sisko.replit.dev'
  return NextResponse.redirect(`${siteUrl}/?error=auth&detail=no_code`)
}
