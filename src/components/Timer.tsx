import { useEffect, useRef, useState } from 'react'
import { GripHorizontal, Pause, Play, RotateCcw, X } from 'lucide-react'
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

type Corner = 'tl' | 'tr' | 'bl' | 'br'

function readCorner(): Corner {
  try {
    const c = window.localStorage.getItem('mi44:timer-corner')
    if (c === 'tl' || c === 'tr' || c === 'bl' || c === 'br') return c
  } catch {
    /* storage unavailable */
  }
  return 'bl'
}

/** A small floating timer. Drag it anywhere; on release it snaps to the nearest corner,
 *  so it never sits on top of the slide she is teaching from. */
export function TimerOverlay({ seconds, onClose }: { seconds: number; onClose: () => void }) {
  const [left, setLeft] = useState(seconds)
  const [running, setRunning] = useState(true)
  const [corner, setCorner] = useState<Corner>(readCorner)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const end = useRef(performance.now() + seconds * 1000)
  const box = useRef<HTMLDivElement>(null)
  const grab = useRef({ dx: 0, dy: 0, moved: false })

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

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    const r = box.current!.getBoundingClientRect()
    grab.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDrag({ x: r.left, y: r.top })
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return
    grab.current.moved = true
    setDrag({ x: e.clientX - grab.current.dx, y: e.clientY - grab.current.dy })
  }
  const onUp = () => {
    if (!drag || !box.current) return setDrag(null)
    const r = box.current.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const c: Corner = `${cy < window.innerHeight / 2 ? 't' : 'b'}${cx < window.innerWidth / 2 ? 'l' : 'r'}` as Corner
    setCorner(c)
    try {
      window.localStorage.setItem('mi44:timer-corner', c)
    } catch {
      /* storage unavailable */
    }
    setDrag(null)
  }

  const whole = Math.ceil(left)
  const mm = Math.floor(whole / 60)
  const ss = String(whole % 60).padStart(2, '0')
  const R = 42
  const circ = 2 * Math.PI * R
  const frac = left / seconds
  const done = left <= 0
  const color = done ? 'var(--color-bad)' : frac < 0.25 ? 'var(--color-solution)' : 'var(--color-primary)'

  // Top corners sit over the date and pill row; bottom corners stay above the dock.
  const pos: React.CSSProperties = drag
    ? { left: drag.x, top: drag.y }
    : {
        top: corner[0] === 't' ? '0.6rem' : undefined,
        bottom: corner[0] === 'b' ? '4.6rem' : undefined,
        left: corner[1] === 'l' ? '0.75rem' : undefined,
        right: corner[1] === 'r' ? '0.75rem' : undefined,
      }

  return (
    <div
      ref={box}
      role="timer"
      aria-label="Timer"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={pos}
      className={`fixed z-[60] flex touch-none select-none items-center gap-2 rounded-2xl border-2 bg-white/95 p-2 pr-2.5 shadow-[0_8px_28px_rgb(29_36_51/0.22)] backdrop-blur ${done ? 'border-bad animate-pulse' : 'border-line'} ${drag ? 'cursor-grabbing' : 'cursor-grab transition-[top,left,right,bottom] duration-200'}`}
    >
      <div className="relative h-[4.6rem] w-[4.6rem] shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--color-line)" strokeWidth="9" />
          <circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)} />
        </svg>
        <div className={`absolute inset-0 grid place-items-center font-display font-extrabold tabular-nums ${done ? 'text-[0.95rem] text-bad' : 'text-[1.3rem] text-ink'}`}>{done ? 'Time!' : `${mm}:${ss}`}</div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          {!done && (
            <button type="button" className="grid h-8 w-8 place-items-center rounded-lg bg-canvas text-ink-2 hover:bg-primary-soft hover:text-primary" onClick={() => setRunning((r) => !r)} aria-label={running ? 'Pause' : 'Resume'} title={running ? 'Pause' : 'Resume'}>
              {running ? <Pause size={16} /> : <Play size={16} />}
            </button>
          )}
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg bg-canvas text-ink-2 hover:bg-primary-soft hover:text-primary"
            onClick={() => {
              setLeft(seconds)
              setRunning(false)
              setTimeout(() => setRunning(true), 0)
            }}
            aria-label="Restart"
            title="Restart"
          >
            <RotateCcw size={16} />
          </button>
          <button type="button" className="grid h-8 w-8 place-items-center rounded-lg bg-canvas text-ink-2 hover:bg-bad-soft hover:text-bad" onClick={onClose} aria-label="Close timer" title="Close">
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-1 text-[0.7rem] font-bold text-muted">
          <GripHorizontal size={14} /> drag me
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
