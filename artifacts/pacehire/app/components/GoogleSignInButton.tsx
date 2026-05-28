'use client'

import { createClient } from '@/lib/supabase/client'

export default function GoogleSignInButton({ variant = 'primary', label = 'Sign in with Google' }: { variant?: 'primary' | 'outline', label?: string }) {
  const handleClick = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://a8f9dcf2-b670-42fe-9851-a94a06d61268-00-gko79s5rzbvn.sisko.replit.dev/auth/callback'
      }
    })
  }

  if (variant === 'outline') {
    return (
      <button
        onClick={handleClick}
        className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-500 hover:bg-blue-600/10 transition-colors"
      >
        {label}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
    >
      {label}
    </button>
  )
}
