export default function DashboardLoading() {
  return (
    <div style={{ backgroundColor: '#0a0f1e', color: '#f1f5f9', minHeight: '100vh' }}>
      {/* Header skeleton */}
      <div
        className="flex items-center justify-between border-b px-6 py-4"
        style={{ borderColor: '#1e3a5f' }}
      >
        <div className="h-5 w-24 animate-pulse rounded" style={{ backgroundColor: '#1e3a5f' }} />
        <div className="h-8 w-8 animate-pulse rounded-full" style={{ backgroundColor: '#1e3a5f' }} />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Welcome row */}
        <div className="mb-8 flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-7 w-52 animate-pulse rounded" style={{ backgroundColor: '#1e3a5f' }} />
            <div className="h-4 w-36 animate-pulse rounded" style={{ backgroundColor: '#1e3a5f' }} />
          </div>
          <div className="h-9 w-32 animate-pulse rounded-lg" style={{ backgroundColor: '#1e3a5f' }} />
        </div>

        {/* Template card skeletons */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-xl border p-5"
              style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
            >
              <div className="h-5 w-3/4 animate-pulse rounded" style={{ backgroundColor: '#1e3a5f' }} />
              <div className="h-3 w-1/3 animate-pulse rounded" style={{ backgroundColor: '#1e3a5f' }} />
              <div className="flex flex-col gap-1.5 pt-1">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-3 animate-pulse rounded" style={{ backgroundColor: '#1e3a5f', width: `${70 + j * 5}%` }} />
                ))}
              </div>
              <div className="mt-auto h-9 animate-pulse rounded-lg pt-3" style={{ backgroundColor: '#1e3a5f' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
