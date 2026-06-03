'use client'

import Link from 'next/link'

type Tab = 'templates' | 'candidates' | 'roles'

const TABS: { key: Tab; label: string }[] = [
  { key: 'templates',  label: 'Templates'  },
  { key: 'candidates', label: 'Candidates' },
  { key: 'roles',      label: 'Roles'      },
]

export default function TabBar({ activeTab }: { activeTab: Tab }) {
  return (
    <div
      className="flex gap-0 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {TABS.map(tab => {
        const isActive = tab.key === activeTab
        return (
          <Link
            key={tab.key}
            href={`/dashboard?tab=${tab.key}`}
            className="relative px-5 py-3 text-sm font-medium transition-colors"
            style={{
              color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
            }}
          >
            {tab.label}
            {isActive && (
              <span
                className="absolute inset-x-0 bottom-0 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--color-brand)' }}
              />
            )}
          </Link>
        )
      })}
    </div>
  )
}
