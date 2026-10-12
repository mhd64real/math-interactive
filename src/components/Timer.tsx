import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, X } from 'lucide-react'
import { Illus } from './ui'

// Her 60 second and 2 minute timers, as a big overlay that works on the projector.

function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    ;[880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = f
      o.connect(g)
      g.connect(ctx.destination)
      const t = ctx.currentTime + i * 0.22
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
      o.start(t)
      o.stop(t + 0.65)
    })
    setTimeout(() => ctx.close(), 1500)
  } catch {
    /* audio not available */
  }
}

export function TimerOverlay({ seconds, onClose }: { seconds: number; onClose: () => void }) {
  const [left, setLeft] = useState(seconds)
  const [running, setRunning] = useState(true)
  const end = useRef(performance.now() + seconds * 1000)

  useEffect(() => {
    if (!running) return
    end.current = performance.now() + left * 1000
    const id = window.setInterval(() => {
      const l = Math.max(0, (end.current - performance.now()) / 1000)
      setLeft(l)
      if (l <= 0) {
        setRunning(false)
        chime()
      }
    }, 100)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  const whole = Math.ceil(left)
  const mm = Math.floor(whole / 60)
  const ss = String(whole % 60).padStart(2, '0')
  const R = 88
  const circ = 2 * Math.PI * R
  const frac = left / seconds
  const done = left <= 0

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/40 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="card relative w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Timer">
        <button type="button" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-canvas" onClick={onClose} aria-label="Close timer">
          <X size={20} />
        </button>
        <div className="relative mx-auto h-52 w-52">
          <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
            <circle cx="100" cy="100" r={R} fill="none" stroke="var(--color-line)" strokeWidth="14" />
            <circle cx="100" cy="100" r={R} fill="none" stroke={done ? 'var(--color-bad)' : frac < 0.25 ? 'var(--color-solution)' : 'var(--color-primary)'} strokeWidth="14" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)} />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className={`font-display text-6xl font-extrabold tabular-nums ${done ? 'text-bad' : 'text-ink'}`}>{done ? "Time's up" : `${mm}:${ss}`}</div>
          </div>
        </div>
        <div className="mt-4 flex justify-center gap-2">
          {!done && (
            <button type="button" className="btn btn-soft" onClick={() => setRunning((r) => !r)}>
              {running ? <Pause size={18} /> : <Play size={18} />} {running ? 'Pause' : 'Resume'}
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setLeft(seconds)
              setRunning(false)
              setTimeout(() => setRunning(true), 0)
            }}
          >
            <RotateCcw size={18} /> Restart
          </button>
        </div>
      </div>
    </div>
  )
}

export function TimerButton({ seconds, onStart, compact = false }: { seconds: number; onStart: (s: number) => void; compact?: boolean }) {
  const label = seconds >= 60 && seconds % 60 === 0 && seconds !== 60 ? `${seconds / 60}:00` : `${seconds}s`
  return (
    <button
      type="button"
      onClick={() => onStart(seconds)}
      className={`inline-flex items-center gap-1.5 rounded-full border-2 border-line bg-white font-extrabold text-ink-2 hover:border-primary/40 ${compact ? 'py-0.5 pl-0.5 pr-2.5 text-[0.8rem]' : 'py-1 pl-1 pr-3 text-[0.9rem]'}`}
      title={`Start a ${label} timer`}
    >
      <Illus name="stopwatch" className={compact ? 'h-6 w-6' : 'h-7 w-7'} />
      {label}
    </button>
  )
}
