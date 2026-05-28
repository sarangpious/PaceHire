'use client'

import Link from 'next/link'

export default function SessionError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 text-center"
      style={{ backgroundColor: '#0a0f1e', color: '#f1f5f9' }}
    >
      <p className="text-base font-semibold">Couldn&rsquo;t load this session.</p>
      <p className="text-sm" style={{ color: '#94a3b8' }}>
        Something went wrong loading the template. Try refreshing.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: '#1A56DB' }}
        >
          Refresh
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border px-5 py-2.5 text-sm font-medium"
          style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
