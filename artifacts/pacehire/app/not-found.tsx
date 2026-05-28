import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 text-center"
      style={{ backgroundColor: '#0a0f1e', color: '#f1f5f9' }}
    >
      <p className="text-7xl font-bold" style={{ color: '#1e3a5f' }}>404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm" style={{ color: '#94a3b8' }}>
        The page you&rsquo;re looking for doesn&rsquo;t exist.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
        style={{ backgroundColor: '#1A56DB' }}
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
