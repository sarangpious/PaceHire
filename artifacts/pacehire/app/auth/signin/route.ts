import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://hgvrhifzxqjvrdhjwhan.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndnJoaWZ6eHFqdnJkaGp3aGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4Nzc3ODQsImV4cCI6MjA5NTQ1Mzc4NH0.XPsJRbAE13i200dFwU17IhhfYw2MlXI1gSsGdHXccC8'
const SITE_URL = 'https://a8f9dcf2-b670-42fe-9851-a94a06d61268-00-gko79s5rzbvn.sisko.replit.dev'

export async function GET() {
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

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${SITE_URL}/auth/callback`,
      skipBrowserRedirect: false,
    },
  })

  console.log('[signin] data:', data)
  console.log('[signin] error:', error)

  if (error || !data.url) {
    return NextResponse.redirect(`${SITE_URL}/?error=auth&detail=${encodeURIComponent(error?.message || 'no url')}`)
  }

  return NextResponse.redirect(data.url)
}
