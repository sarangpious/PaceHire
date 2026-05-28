import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = 'https://hgvrhifzxqjvrdhjwhan.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndnJoaWZ6eHFqdnJkaGp3aGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4Nzc3ODQsImV4cCI6MjA5NTQ1Mzc4NH0.XPsJRbAE13i200dFwU17IhhfYw2MlXI1gSsGdHXccC8'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component — session refresh handled by middleware
        }
      },
    },
  })
}
