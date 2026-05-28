'use client'

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 text-center"
      style={{ backgroundColor: '#0a0f1e', color: '#f1f5f9' }}
    >
      <p className="text-base font-semibold">Something went wrong.</p>
      <p className="text-sm" style={{ color: '#94a3b8' }}>
        There was a problem loading your dashboard. Try refreshing.
      </p>
      <button
        onClick={reset}
        className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
        style={{ backgroundColor: '#1A56DB' }}
      >
        Refresh
      </button>
    </div>
  )
}
