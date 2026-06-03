'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Pause,
  Play,
  SkipForward,
  Plus,
  X,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

type Section = {
  id: string
  name: string
  duration_minutes: number
  order: number
}

type Template = {
  id: string
  name: string
  sections: Section[]
  total_duration: number | null
}

type SectionResult = {
  section_id: string
  name: string
  planned_seconds: number
  actual_seconds: number
  skipped: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const abs = Math.abs(Math.round(totalSeconds))
  const m = Math.floor(abs / 60)
  const s = abs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function playBeep(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.value = 440
  gain.gain.setValueAtTime(0.25, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.25)
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  template: Template
}

export default function SessionScreen({ template }: Props) {
  const router = useRouter()

  const sections: Section[] = [...template.sections].sort((a, b) => a.order - b.order)

  const [sectionIndex, setSectionIndex] = useState(0)
  const [secondsRemaining, setSecondsRemaining] = useState(
    sections[0].duration_minutes * 60
  )
  const [isPaused, setIsPaused] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fade, setFade] = useState(true)
  const [sectionResults, setSectionResults] = useState<SectionResult[]>([])

  // Compact (PiP) mode
  const [isCompact, setIsCompact] = useState(false)
  const [pipPos, setPipPos] = useState<{ x: number; y: number } | null>(null)
  const pipDragRef = useRef({ active: false, ox: 0, oy: 0 })

  // Record when the session started (ISO string, set once on mount)
  const sessionStartRef = useRef(new Date().toISOString())

  // Refs to avoid stale closures inside intervals
  const soundRef = useRef(soundEnabled)
  soundRef.current = soundEnabled
  const isPausedRef = useRef(isPaused)
  isPausedRef.current = isPaused
  const beepFiredRef = useRef(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  function getAudioCtx(): AudioContext {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    return audioCtxRef.current
  }

  // ── Derived values ────────────────────────────────────────────────

  const currentSection = sections[sectionIndex]
  const nextSection = sections[sectionIndex + 1] ?? null
  const sectionTotalSeconds = currentSection.duration_minutes * 60
  const isOverrun = secondsRemaining < 0

  const pctElapsed = Math.min(
    100,
    ((sectionTotalSeconds - Math.max(0, secondsRemaining)) / sectionTotalSeconds) * 100
  )
  const pctRemaining = Math.max(0, secondsRemaining) / sectionTotalSeconds

  const pacingColor =
    pctRemaining > 0.4 ? '#22c55e' : pctRemaining > 0.1 ? '#f59e0b' : '#ef4444'

  const totalRemaining =
    secondsRemaining +
    sections.slice(sectionIndex + 1).reduce((s, sec) => s + sec.duration_minutes * 60, 0)

  // ── Beep on section boundary ─────────────────────────────────────

  useEffect(() => {
    if (secondsRemaining === 0 && !beepFiredRef.current && soundRef.current) {
      beepFiredRef.current = true
      try {
        playBeep(getAudioCtx())
      } catch {}
    }
  }, [secondsRemaining])

  // ── Countdown interval ───────────────────────────────────────────

  useEffect(() => {
    const id = setInterval(() => {
      if (isPausedRef.current) return
      setSecondsRemaining(prev => prev - 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Fullscreen events ────────────────────────────────────────────

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // ── PiP init + drag ─────────────────────────────────────────────
  useEffect(() => {
    setPipPos({ x: window.innerWidth - 308, y: window.innerHeight - 220 })
  }, [])

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!pipDragRef.current.active) return
      const x = Math.max(0, Math.min(window.innerWidth - 284, e.clientX - pipDragRef.current.ox))
      const y = Math.max(0, Math.min(window.innerHeight - 180, e.clientY - pipDragRef.current.oy))
      setPipPos({ x, y })
    }
    function onUp() { pipDragRef.current.active = false }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  // ── Section advance ──────────────────────────────────────────────

  function advance(skipped = false) {
    const actualSeconds = sectionTotalSeconds - secondsRemaining // positive = elapsed
    const result: SectionResult = {
      section_id: currentSection.id,
      name: currentSection.name,
      planned_seconds: sectionTotalSeconds,
      actual_seconds: Math.max(0, actualSeconds),
      skipped,
    }
    const newResults = [...sectionResults, result]

    if (sectionIndex === sections.length - 1) {
      // Last section — write summary and navigate
      const totalActualSeconds = newResults.reduce((sum, r) => sum + r.actual_seconds, 0)
      const payload = {
        templateId: template.id,
        templateName: template.name,
        plannedDuration: template.total_duration ?? 0,
        actualDuration: totalActualSeconds,
        startedAt: sessionStartRef.current,
        sections: newResults.map(r => ({
          id: r.section_id,
          name: r.name,
          plannedSeconds: r.planned_seconds,
          actualSeconds: r.actual_seconds,
          skipped: r.skipped,
        })),
      }
      try {
        sessionStorage.setItem('pacehire_session_result', JSON.stringify(payload))
      } catch {}
      router.push(`/session/${template.id}/summary`)
      return
    }

    // Fade-out → swap → fade-in
    setFade(false)
    setSectionResults(newResults)

    setTimeout(() => {
      const nextIdx = sectionIndex + 1
      setSectionIndex(nextIdx)
      setSecondsRemaining(sections[nextIdx].duration_minutes * 60)
      beepFiredRef.current = false
      setFade(true)
    }, 220)
  }

  function extendTime(minutes: number) {
    setSecondsRemaining(prev => prev + minutes * 60)
    // If we just un-overran, let the beep fire again if we overrun again
    if (isOverrun) beepFiredRef.current = false
  }

  function exitEarly() {
    if (!confirm('End this session early? Progress will be saved.')) return

    const elapsed = sectionTotalSeconds - Math.max(0, secondsRemaining)
    const currentResult: SectionResult = {
      section_id: currentSection.id,
      name: currentSection.name,
      planned_seconds: sectionTotalSeconds,
      actual_seconds: Math.max(0, elapsed),
      skipped: false,
    }
    const allResults = [...sectionResults, currentResult]
    const totalActualSeconds = allResults.reduce((sum, r) => sum + r.actual_seconds, 0)

    const payload = {
      templateId: template.id,
      templateName: template.name,
      plannedDuration: template.total_duration ?? 0,
      actualDuration: totalActualSeconds,
      startedAt: sessionStartRef.current,
      sections: allResults.map(r => ({
        id: r.section_id,
        name: r.name,
        plannedSeconds: r.planned_seconds,
        actualSeconds: r.actual_seconds,
        skipped: r.skipped,
      })),
    }

    try {
      sessionStorage.setItem('pacehire_session_result', JSON.stringify(payload))
    } catch {}

    router.push(`/session/${template.id}/summary`)
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <>
    <div
      className="relative flex min-h-screen select-none flex-col"
      style={{ backgroundColor: '#0a0f1e', color: '#f1f5f9', display: isCompact ? 'none' : 'flex' }}
    >
      {/* Ambient glow — color reacts to pacing state */}
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-[1200ms]"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 55%, ${pacingColor}18 0%, transparent 70%)`,
        }}
      />

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          {/* Exit session */}
          <button
            onClick={exitEarly}
            className="rounded p-1.5"
            style={{ color: '#64748b' }}
            title="End session early"
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
          >
            <X className="h-4 w-4" />
          </button>
          <span className="max-w-xs truncate text-sm font-medium" style={{ color: '#94a3b8' }}>
            {template.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-sm tabular-nums" style={{ color: '#94a3b8' }}>
            {formatTime(Math.max(0, totalRemaining))} total
          </span>

          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(v => !v)}
            className="rounded p-1.5"
            style={{ color: '#64748b' }}
            title={soundEnabled ? 'Mute beep' : 'Enable beep'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Compact toggle — hidden on mobile */}
          <button
            onClick={() => setIsCompact(true)}
            className="hidden rounded p-1.5 sm:block"
            style={{ color: '#64748b' }}
            title="Compact mode"
          >
            <Minimize2 className="h-4 w-4" />
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="rounded p-1.5"
            style={{ color: '#64748b' }}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* ── Hero center ─────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6">
        {/* Section label + name */}
        <div
          className="flex flex-col items-center gap-2 transition-opacity duration-200"
          style={{ opacity: fade ? 1 : 0 }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: '#475569' }}
          >
            Section {sectionIndex + 1} of {sections.length}
          </p>
          <h1
            className="text-center text-4xl font-bold leading-tight"
            style={{ color: '#f1f5f9' }}
          >
            {currentSection.name}
          </h1>
        </div>

        {/* Timer */}
        <div
          className="flex flex-col items-center transition-opacity duration-200"
          style={{ opacity: fade ? 1 : 0 }}
        >
          {isOverrun && (
            <p className="mb-1 text-sm font-semibold tracking-wide" style={{ color: '#ef4444' }}>
              OVERRUN +
            </p>
          )}
          <span
            className="session-timer font-mono font-bold leading-none tracking-tight tabular-nums"
            style={{
              color: isOverrun ? '#ef4444' : '#f1f5f9',
              transition: 'color 0.6s ease',
            }}
          >
            {formatTime(secondsRemaining)}
          </span>

          {/* Progress bar */}
          <div
            className="mt-7 h-1.5 w-80 max-w-full overflow-hidden rounded-full"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${pctElapsed}%`,
                backgroundColor: pacingColor,
                boxShadow: `0 0 10px ${pacingColor}90`,
                transition: 'width 1s linear, background-color 0.6s ease, box-shadow 0.6s ease',
              }}
            />
          </div>
        </div>

        {/* Up next */}
        <div className="h-5 text-center text-sm" style={{ color: '#64748b' }}>
          {nextSection ? (
            <>
              Up next:{' '}
              <span style={{ color: '#94a3b8' }}>{nextSection.name}</span>
              {' · '}
              <span>{nextSection.duration_minutes} min</span>
            </>
          ) : (
            <span>Last section</span>
          )}
        </div>
      </div>

      {/* ── Bottom controls ──────────────────────────────────────── */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 px-6 py-8">
        {/* Pause / Resume */}
        <ControlButton
          onClick={() => setIsPaused(v => !v)}
          icon={isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          label={isPaused ? 'Resume' : 'Pause'}
        />

        {/* Extend +1 */}
        <ControlButton
          onClick={() => extendTime(1)}
          icon={<Plus className="h-3.5 w-3.5" />}
          label="+1 min"
        />

        {/* Extend +2 */}
        <ControlButton
          onClick={() => extendTime(2)}
          icon={<Plus className="h-3.5 w-3.5" />}
          label="+2 min"
        />

        {/* Next / End */}
        <ControlButton
          onClick={() => advance(false)}
          icon={<SkipForward className="h-4 w-4" />}
          label={sectionIndex === sections.length - 1 ? 'End Session' : 'Next Section →'}
          prominent
        />
      </div>

      {/* Paused overlay indicator */}
      {isPaused && (
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 text-center"
          style={{ marginTop: '3rem' }}
        >
          <span
            className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{ backgroundColor: 'rgba(30,58,95,0.9)', color: '#94a3b8' }}
          >
            Paused
          </span>
        </div>
      )}
    </div>

    {/* ── PiP compact card ────────────────────────────────────────── */}
    {isCompact && pipPos && (
      <div
        className="fixed z-50 w-[280px] overflow-hidden rounded-2xl shadow-2xl"
        style={{
          left: pipPos.x,
          top: pipPos.y,
          backgroundColor: '#111827',
          border: '1px solid #1e3a5f',
          cursor: 'grab',
          userSelect: 'none',
        }}
        onMouseDown={(e) => {
          pipDragRef.current = {
            active: true,
            ox: e.clientX - pipPos.x,
            oy: e.clientY - pipPos.y,
          }
          e.preventDefault()
        }}
      >
        {/* Pacing color bar */}
        <div
          style={{
            height: 4,
            backgroundColor: pacingColor,
            transition: 'background-color 0.6s ease',
          }}
        />
        {/* Card body */}
        <div className="px-3 pb-3 pt-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium" style={{ color: '#94a3b8' }}>
              {currentSection.name}
            </span>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setIsCompact(false)}
              className="flex-shrink-0 rounded p-0.5"
              style={{ color: '#64748b' }}
              title="Expand"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {isOverrun && (
            <p className="mb-0.5 text-xs font-bold" style={{ color: '#ef4444' }}>
              OVERRUN +
            </p>
          )}
          <p
            className="font-mono font-bold tabular-nums"
            style={{
              fontSize: '2.5rem',
              lineHeight: 1,
              color: isOverrun ? '#ef4444' : '#f1f5f9',
            }}
          >
            {formatTime(secondsRemaining)}
          </p>
          <p className="mt-1.5 text-xs" style={{ color: '#475569' }}>
            Section {sectionIndex + 1} of {sections.length}
          </p>
        </div>
      </div>
    )}
    </>
  )
}

// ── Control button sub-component ──────────────────────────────────────────

function ControlButton({
  onClick,
  icon,
  label,
  prominent = false,
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  prominent?: boolean
}) {
  const [hovered, setHovered] = useState(false)

  const base: React.CSSProperties = {
    borderColor: prominent
      ? hovered
        ? '#3b82f6'
        : '#1e3a5f'
      : hovered
      ? '#334155'
      : '#1e3a5f',
    color: prominent ? (hovered ? '#f1f5f9' : '#cbd5e1') : hovered ? '#94a3b8' : '#64748b',
    transition: 'border-color 0.15s, color 0.15s',
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium"
      style={base}
    >
      {icon}
      {label}
    </button>
  )
}
