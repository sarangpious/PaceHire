'use client'

import { createClient } from '@/lib/supabase/client'

export default function GoogleSignInButton({ variant = 'primary', label = 'Sign in with Google' }: { variant?: 'primary' | 'outline', label?: string }) {
  const handleClick = async () => {
    console.log('BUTTON CLICKED')
    try {
      const supabase = createClient()
      console.log('Supabase client created:', !!supabase)
      console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://a8f9dcf2-b670-42fe-9851-a94a06d61268-00-gko79s5rzbvn.sisko.replit.dev/auth/callback'
        }
      })

      console.log('OAuth response data:', data)
      console.log('OAuth response error:', error)

      if (error) {
        alert('Auth error: ' + error.message)
      }

      if (data?.url) {
        console.log('Redirecting to:', data.url)
        window.location.replace(data.url)
      } else {
        alert('No redirect URL returned from Supabase. Check console.')
      }
    } catch (err) {
      console.error('Caught error:', err)
      alert('Caught error: ' + String(err))
    }
  }

  console.log('GoogleSignInButton rendering, variant:', variant)

  if (variant === 'outline') {
    return (
      <button
        onClick={(e) => { console.log('RAW CLICK EVENT', e); handleClick(); }}
        className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-500 hover:bg-blue-600/10 transition-colors"
      >
        {label}
      </button>
    )
  }

  return (
    <button
      onClick={(e) => { console.log('RAW CLICK EVENT', e); handleClick(); }}
      className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
    >
      {label}
    </button>
  )
}
