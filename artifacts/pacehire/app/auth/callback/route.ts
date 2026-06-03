import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SUPABASE_URL = 'https://hgvrhifzxqjvrdhjwhan.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndnJoaWZ6eHFqdnJkaGp3aGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4Nzc3ODQsImV4cCI6MjA5NTQ1Mzc4NH0.XPsJRbAE13i200dFwU17IhhfYw2MlXI1gSsGdHXccC8'
const SITE_URL = 'https://a8f9dcf2-b670-42fe-9851-a94a06d61268-00-gko79s5rzbvn.sisko.replit.dev'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    })

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[auth/callback] session exchange failed:', error.message)
      return NextResponse.redirect(`${SITE_URL}/?error=auth`)
    }
  }

  return NextResponse.redirect(`${SITE_URL}/dashboard`)
}
