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
  ExternalLink,
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

// ── Popup HTML ─────────────────────────────────────────────────────────────

const POPUP_HTML = `<!DOCTYPE html>
<html>
<head>
<title>PaceHire Timer</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0f1e;color:#f1f5f9;font-family:monospace;overflow:hidden;height:100vh;display:flex;flex-direction:column}
#bar{height:4px;width:100%;background:#22c55e;transition:background .6s ease;flex-shrink:0}
#body{flex:1;display:flex;flex-direction:column;justify-content:center;padding:10px 14px 14px}
#name{font-size:11px;color:#94a3b8;font-family:-apple-system,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px}
#overrun{font-size:11px;color:#ef4444;font-family:-apple-system,sans-serif;font-weight:700;margin-bottom:2px;display:none}
#timer{font-size:64px;font-weight:700;letter-spacing:-2px;line-height:1;color:#f1f5f9;margin-bottom:6px}
#prog{font-size:11px;color:#475569;font-family:-apple-system,sans-serif}
#paused{font-size:10px;color:#94a3b8;font-family:-apple-system,sans-serif;text-transform:uppercase;letter-spacing:.1em;background:rgba(30,58,95,.9);border-radius:99px;padding:2px 8px;display:none;margin-top:6px}
#ended{display:none;font-size:14px;color:#94a3b8;font-family:-apple-system,sans-serif;text-align:center;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
</style>
</head>
<body>
<div id="bar"></div>
<div id="body">
  <div id="name">Connecting…</div>
  <div id="overrun">OVERRUN +</div>
  <div id="timer">--:--</div>
  <div id="prog"></div>
  <div id="paused">Paused</div>
</div>
<div id="ended">Session ended</div>
<script>
var bar=document.getElementById('bar');
var nameEl=document.getElementById('name');
var overrunEl=document.getElementById('overrun');
var timerEl=document.getElementById('timer');
var progEl=document.getElementById('prog');
var pausedEl=document.getElementById('paused');
var bodyEl=document.getElementById('body');
var endedEl=document.getElementById('ended');
var endedTimer=null;
var colors={green:'#22c55e',amber:'#f59e0b',red:'#ef4444'};
function fmt(s){var a=Math.abs(Math.round(s));var m=Math.floor(a/60);var sec=a%60;return(m<10?'0':'')+m+':'+(sec<10?'0':'')+sec;}
setInterval(function(){
  try{
    var raw=localStorage.getItem('pacehire_pip_state');
    if(!raw||raw==='null'){
      if(!endedTimer){
        bodyEl.style.display='none';
        endedEl.style.display='block';
        endedTimer=setTimeout(function(){window.close();},3000);
      }
      return;
    }
    var s=JSON.parse(raw);
    bar.style.background=colors[s.pacingState]||'#22c55e';
    nameEl.textContent=s.sectionName||'';
    timerEl.textContent=fmt(s.timeRemaining);
    timerEl.style.color=s.isOverrun?'#ef4444':'#f1f5f9';
    overrunEl.style.display=s.isOverrun?'block':'none';
    progEl.textContent='Section '+s.sectionIndex+' of '+s.totalSections;
    pausedEl.style.display=s.isPaused?'inline-block':'none';
  }catch(e){}
},500);
</script>
</body>
</html>`

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  template: Template
  sessionId: string | null
  candidateInfo: { name: string; role: string } | null
}

export default function SessionScreen({ template, sessionId, candidateInfo }: Props) {
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
  const [showExitDialog, setShowExitDialog] = useState(false)

  const sessionStartRef = useRef(new Date().toISOString())
  const soundRef = useRef(soundEnabled)
  soundRef.current = soundEnabled
  const isPausedRef = useRef(isPaused)
  isPausedRef.current = isPaused
  const beepFiredRef = useRef(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const popupRef = useRef<Window | null>(null)

  function getAudioCtx(): AudioContext {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    return audioCtxRef.current
  }

  // ── Derived values ─────────────────────────────────────────────────

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
  const pacingState =
    pctRemaining > 0.4 ? 'green' : pctRemaining > 0.1 ? 'amber' : 'red'

  const totalRemaining =
    secondsRemaining +
    sections.slice(sectionIndex + 1).reduce((s, sec) => s + sec.duration_minutes * 60, 0)

  // ── Sync popup via localStorage ────────────────────────────────────

  useEffect(() => {
    try {
      localStorage.setItem(
        'pacehire_pip_state',
        JSON.stringify({
          sectionName: currentSection.name,
          timeRemaining: secondsRemaining,
          totalRemaining,
          pacingState,
          sectionIndex: sectionIndex + 1,
          totalSections: sections.length,
          isPaused,
          isOverrun,
        })
      )
    } catch {}
  }, [secondsRemaining, sectionIndex, isPaused])

  // ── Cleanup on unmount ─────────────────────────────────────────────

  useEffect(() => {
    return () => {
      try { localStorage.setItem('pacehire_pip_state', 'null') } catch {}
      popupRef.current?.close()
    }
  }, [])

  // ── Beep on section boundary ───────────────────────────────────────

  useEffect(() => {
    if (secondsRemaining === 0 && !beepFiredRef.current && soundRef.current) {
      beepFiredRef.current = true
      try { playBeep(getAudioCtx()) } catch {}
    }
  }, [secondsRemaining])

  // ── Countdown interval ─────────────────────────────────────────────

  useEffect(() => {
    const id = setInterval(() => {
      if (isPausedRef.current) return
      setSecondsRemaining(prev => prev - 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Fullscreen events ──────────────────────────────────────────────

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  function openPopup() {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus()
      return
    }
    const popup = window.open(
      '',
      'pacehire_pip',
      'width=300,height=200,top=20,right=20,resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no,alwaysOnTop=yes'
    )
    if (!popup) {
      alert('Pop-out blocked. Please allow pop-ups for this site.')
      return
    }
    popupRef.current = popup
    popup.document.write(POPUP_HTML)
    popup.document.close()
  }

  // ── Session helpers ────────────────────────────────────────────────

  function buildPayload(results: SectionResult[]) {
    const totalActualSeconds = results.reduce((sum, r) => sum + r.actual_seconds, 0)
    return {
      templateId: template.id,
      templateName: template.name,
      plannedDuration: template.total_duration ?? 0,
      actualDuration: totalActualSeconds,
      startedAt: sessionStartRef.current,
      sections: results.map(r => ({
        id: r.section_id,
        name: r.name,
        plannedSeconds: r.planned_seconds,
        actualSeconds: r.actual_seconds,
        skipped: r.skipped,
      })),
    }
  }

  function finishSession(results: SectionResult[]) {
    try {
      sessionStorage.setItem('pacehire_session_result', JSON.stringify(buildPayload(results)))
    } catch {}
    try { localStorage.setItem('pacehire_pip_state', 'null') } catch {}
    popupRef.current?.close()
    // Navigate to scorecard if we have a pre-created session, else summary (demo)
    if (sessionId) {
      router.push(`/session/${sessionId}/scorecard`)
    } else {
      router.push(`/session/${template.id}/summary`)
    }
  }

  function advance(skipped = false) {
    const actualSeconds = sectionTotalSeconds - secondsRemaining
    const result: SectionResult = {
      section_id: currentSection.id,
      name: currentSection.name,
      planned_seconds: sectionTotalSeconds,
      actual_seconds: Math.max(0, actualSeconds),
      skipped,
    }
    const newResults = [...sectionResults, result]

    if (sectionIndex === sections.length - 1) {
      finishSession(newResults)
      return
    }

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
    if (isOverrun) beepFiredRef.current = false
  }

  function confirmExit() {
    setShowExitDialog(false)
    const elapsed = sectionTotalSeconds - Math.max(0, secondsRemaining)
    const currentResult: SectionResult = {
      section_id: currentSection.id,
      name: currentSection.name,
      planned_seconds: sectionTotalSeconds,
      actual_seconds: Math.max(0, elapsed),
      skipped: false,
    }
    finishSession([...sectionResults, currentResult])
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div
      className="relative flex min-h-screen select-none flex-col"
      style={{ backgroundColor: '#0a0f1e', color: '#f1f5f9' }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-[1200ms]"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 55%, ${pacingColor}18 0%, transparent 70%)`,
        }}
      />

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        {/* Left: End Session + session context */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExitDialog(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              borderColor: 'rgba(239,68,68,0.4)',
              color: '#ef4444',
              backgroundColor: 'rgba(239,68,68,0.08)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.16)'
              e.currentTarget.style.borderColor = '#ef4444'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'
            }}
          >
            <X className="h-3.5 w-3.5" />
            End Session
          </button>

          {/* Context: candidate + role OR template name */}
          <div className="hidden sm:block">
            {candidateInfo ? (
              <span className="text-sm font-medium" style={{ color: '#f1f5f9' }}>
                {candidateInfo.name}
                {candidateInfo.role && (
                  <span style={{ color: '#64748b' }}> · {candidateInfo.role}</span>
                )}
              </span>
            ) : (
              <span className="max-w-[200px] truncate text-sm font-medium" style={{ color: '#94a3b8' }}>
                {template.name}
              </span>
            )}
          </div>
        </div>

        {/* Right: controls */}
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

          {/* Pop-out timer */}
          <button
            onClick={openPopup}
            className="hidden rounded p-1.5 sm:block"
            style={{ color: '#64748b' }}
            title="Pop out timer"
            onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
          >
            <ExternalLink className="h-4 w-4" />
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
        <ControlButton
          onClick={() => setIsPaused(v => !v)}
          icon={isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          label={isPaused ? 'Resume' : 'Pause'}
        />
        <ControlButton
          onClick={() => extendTime(1)}
          icon={<Plus className="h-3.5 w-3.5" />}
          label="+1 min"
        />
        <ControlButton
          onClick={() => extendTime(2)}
          icon={<Plus className="h-3.5 w-3.5" />}
          label="+2 min"
        />
        <ControlButton
          onClick={() => advance(false)}
          icon={<SkipForward className="h-4 w-4" />}
          label={sectionIndex === sections.length - 1 ? 'Finish Session' : 'Next Section →'}
          prominent
        />
      </div>

      {/* Paused indicator */}
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

      {/* ── Exit confirmation dialog ─────────────────────────────── */}
      {showExitDialog && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
            style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
          >
            <h2 className="mb-2 text-lg font-bold">End this session early?</h2>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              Your progress so far will be saved.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExitDialog(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmExit}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: '#ef4444' }}
              >
                End &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Control button sub-component ───────────────────────────────────────────

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
      ? hovered ? '#3b82f6' : '#1e3a5f'
      : hovered ? '#334155' : '#1e3a5f',
    color: prominent
      ? hovered ? '#f1f5f9' : '#cbd5e1'
      : hovered ? '#94a3b8' : '#64748b',
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
