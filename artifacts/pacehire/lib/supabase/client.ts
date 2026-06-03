import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = 'https://hgvrhifzxqjvrdhjwhan.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndnJoaWZ6eHFqdnJkaGp3aGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4Nzc3ODQsImV4cCI6MjA5NTQ1Mzc4NH0.XPsJRbAE13i200dFwU17IhhfYw2MlXI1gSsGdHXccC8'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
