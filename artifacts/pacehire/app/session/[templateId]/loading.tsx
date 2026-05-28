export default function SessionLoading() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-8"
      style={{ backgroundColor: '#0a0f1e' }}
    >
      {/* Section label skeleton */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-3 w-28 animate-pulse rounded" style={{ backgroundColor: '#1e3a5f' }} />
        <div className="h-9 w-64 animate-pulse rounded-lg" style={{ backgroundColor: '#1e3a5f' }} />
      </div>

      {/* Timer skeleton */}
      <div className="flex flex-col items-center gap-4">
        <div className="h-28 w-72 animate-pulse rounded-xl" style={{ backgroundColor: '#1e3a5f' }} />
        <div className="h-1.5 w-80 animate-pulse rounded-full" style={{ backgroundColor: '#1e3a5f' }} />
      </div>

      {/* Controls skeleton */}
      <div className="flex items-center gap-3">
        {[90, 70, 70, 120].map((w, i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-lg"
            style={{ width: w, backgroundColor: '#1e3a5f' }}
          />
        ))}
      </div>
    </div>
  )
}
