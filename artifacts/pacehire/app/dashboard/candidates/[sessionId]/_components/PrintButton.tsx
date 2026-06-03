'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="hidden rounded-lg border px-4 py-2 text-sm font-medium print:hidden sm:block"
      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
    >
      Print / Export
    </button>
  )
}
