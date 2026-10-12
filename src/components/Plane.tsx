import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { C } from '../lib/desmos'
import { gOf, journey, slopeOf, interceptOf, type Pt, type Spec } from '../lib/transform'

// A small hand-drawn coordinate plane in SVG, used for the animated concept cards,
// vocabulary cards and the "same line, different journey" demos.

interface Ctx {
  X: (x: number) => number
  Y: (y: number) => number
  u: number
  x: [number, number]
  y: [number, number]
  clip: string
}
const PlaneCtx = createContext<Ctx | null>(null)
const usePlane = () => {
  const c = useContext(PlaneCtx)
  if (!c) throw new Error('Plane context missing')
  return c
}

interface PlaneProps {
  x: [number, number]
  y: [number, number]
  className?: string
  children?: ReactNode
  label?: string
  axisLabels?: boolean
}

export function Plane({ x, y, className = '', children, label, axisLabels = true }: PlaneProps) {
  const u = 24
  const W = (x[1] - x[0]) * u
  const H = (y[1] - y[0]) * u
  const X = (v: number) => (v - x[0]) * u
  const Y = (v: number) => (y[1] - v) * u
  const id = useId().replace(/:/g, '')
  const clip = `clip-${id}`
  const lines: ReactNode[] = []
  for (let i = Math.ceil(x[0]); i <= Math.floor(x[1]); i++) {
    if (i !== 0) lines.push(<line key={`gx${i}`} x1={X(i)} x2={X(i)} y1={0} y2={H} stroke={C.grid} strokeWidth={1} />)
  }
  for (let j = Math.ceil(y[0]); j <= Math.floor(y[1]); j++) {
    if (j !== 0) lines.push(<line key={`gy${j}`} x1={0} x2={W} y1={Y(j)} y2={Y(j)} stroke={C.grid} strokeWidth={1} />)
  }
  return (
    <PlaneCtx.Provider value={{ X, Y, u, x, y, clip }}>
      <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={label}>
        <defs>
          <clipPath id={clip}>
            <rect x={0} y={0} width={W} height={H} />
          </clipPath>
          {[C.horiz, C.vert, C.parent, C.g, C.answer].map((col) => (
            <marker key={col} id={`m-${id}-${col.slice(1)}`} viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={col} />
            </marker>
          ))}
        </defs>
        <rect x={0} y={0} width={W} height={H} fill="#fff" />
        {lines}
        <line x1={0} x2={W} y1={Y(0)} y2={Y(0)} stroke={C.axis} strokeWidth={1.6} />
        <line x1={X(0)} x2={X(0)} y1={0} y2={H} stroke={C.axis} strokeWidth={1.6} />
        {axisLabels && (
          <>
            <text x={W - 6} y={Y(0) - 6} textAnchor="end" fontSize={13} fontStyle="italic" fill={C.muted} fontFamily="serif">x</text>
            <text x={X(0) + 6} y={14} fontSize={13} fontStyle="italic" fill={C.muted} fontFamily="serif">y</text>
          </>
        )}
        <MarkerIdCtx.Provider value={id}>{children}</MarkerIdCtx.Provider>
      </svg>
    </PlaneCtx.Provider>
  )
}

const MarkerIdCtx = createContext('')

export function FLine({ m, b, color = C.parent, width = 3, dashed = false, opacity = 1 }: { m: number; b: number; color?: string; width?: number; dashed?: boolean; opacity?: number }) {
  const { X, Y, x, clip } = usePlane()
  const x0 = x[0] - 1
  const x1 = x[1] + 1
  return (
    <line
      clipPath={`url(#${clip})`}
      x1={X(x0)}
      y1={Y(m * x0 + b)}
      x2={X(x1)}
      y2={Y(m * x1 + b)}
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dashed ? '7 6' : undefined}
      strokeLinecap="round"
      opacity={opacity}
    />
  )
}

export function Dot({ p, color = C.parent, r = 4.6, hollow = false, opacity = 1 }: { p: Pt; color?: string; r?: number; hollow?: boolean; opacity?: number }) {
  const { X, Y } = usePlane()
  return <circle cx={X(p.x)} cy={Y(p.y)} r={r} fill={hollow ? '#fff' : color} stroke={color} strokeWidth={hollow ? 2.2 : 0} opacity={opacity} />
}

export function Arrow({ from, to, color, width = 3, opacity = 1 }: { from: Pt; to: Pt; color: string; width?: number; opacity?: number }) {
  const { X, Y } = usePlane()
  const mid = useContext(MarkerIdCtx)
  const len = Math.hypot(to.x - from.x, to.y - from.y)
  if (len < 0.08) return null
  // stop the shaft a little early so the head sits on the target point
  const k = Math.max(0, (len - 0.14) / len)
  const tx = from.x + (to.x - from.x) * k
  const ty = from.y + (to.y - from.y) * k
  return (
    <line
      x1={X(from.x)}
      y1={Y(from.y)}
      x2={X(tx)}
      y2={Y(ty)}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      markerEnd={len > 0.45 ? `url(#m-${mid}-${color.slice(1)})` : undefined}
      opacity={opacity}
    />
  )
}

export function Label({ p, children, color = C.parent, dx = 6, dy = -6, anchor = 'start', size = 13, weight = 800 }: { p: Pt; children: ReactNode; color?: string; dx?: number; dy?: number; anchor?: 'start' | 'middle' | 'end'; size?: number; weight?: number }) {
  const { X, Y } = usePlane()
  return (
    <text x={X(p.x) + dx} y={Y(p.y) + dy} textAnchor={anchor} fontSize={size} fontWeight={weight} fill={color} stroke="#fff" strokeWidth={3} paintOrder="stroke" fontFamily="Nunito Variable, sans-serif">
      {children}
    </text>
  )
}

// ---------- animation helpers ----------

export function useReducedMotion() {
  const [r, setR] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setR(mq.matches)
    const on = () => setR(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return r
}

function useInView<T extends Element>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.05 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, inView] as const
}

/** Milliseconds since start, looping every `period`, paused when not running. */
export function useClock(period: number, running: boolean, resetKey: unknown = 0) {
  const [t, setT] = useState(0)
  useEffect(() => {
    setT(0)
  }, [resetKey])
  useEffect(() => {
    if (!running) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64)
      last = now
      setT((v) => (v + dt) % period)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, period])
  return t
}

const ease = (v: number) => (v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2)
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

interface DemoProps {
  s: Spec
  xs: number[]
  x?: [number, number]
  y?: [number, number]
  className?: string
  /** show the final picture without motion */
  still?: boolean
  showG?: boolean
  label?: string
  names?: string[]
  pointLabels?: boolean
  resetKey?: unknown
}

/** Parent line with sample points that travel to g(x): horizontal part (blue) first,
 *  then the vertical part (pink), then g(x) appears. Loops. */
export function TransformDemo({ s, xs, x = [-5, 5], y = [-5, 5], className = '', still = false, showG = true, label, names, pointLabels = false, resetKey }: DemoProps) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>()
  const paths = xs.map((xt) => journey(s, xt))
  const hasH = paths.some((p) => Math.abs(p.mid.x - p.start.x) > 1e-9)
  const hasV = paths.some((p) => Math.abs(p.end.y - p.mid.y) > 1e-9)
  const HOLD = 700
  const MOVE = 1300
  const END = 1700
  const tH = hasH ? MOVE : 0
  const tV = hasV ? MOVE : 0
  const period = HOLD + tH + tV + END
  const frozen = still || reduced
  const t = useClock(period, !frozen && inView, resetKey)
  const now = frozen ? period - 1 : t
  const ph = hasH ? ease(clamp01((now - HOLD) / MOVE)) : 1
  const pv = hasV ? ease(clamp01((now - HOLD - tH) / MOVE)) : 1
  const arrived = now >= HOLD + tH + tV
  const gOpacity = showG ? (arrived ? clamp01((now - HOLD - tH - tV) / 350) : 0) : 0
  const m = slopeOf(s)
  const b = interceptOf(s)

  return (
    <div ref={ref} className={className}>
      <Plane x={x} y={y} className="block h-auto w-full" label={label}>
        <FLine m={1} b={0} color={C.parent} dashed width={2.6} />
        {showG && <FLine m={m} b={b} color={C.g} width={4} opacity={frozen ? 1 : gOpacity} />}
        {paths.map((p, i) => {
          const cx = p.start.x + (p.mid.x - p.start.x) * ph
          const cy = p.mid.y + (p.end.y - p.mid.y) * pv
          const cur = { x: cx, y: cy }
          const corner = { x: cx, y: p.start.y }
          return (
            <g key={i}>
              <Dot p={p.start} color={C.parent} r={4.4} hollow />
              {hasH && <Arrow from={p.start} to={corner} color={C.horiz} width={3.2} />}
              {hasV && ph >= 1 && <Arrow from={p.mid} to={cur} color={C.vert} width={3.2} />}
              <Dot p={cur} color={C.g} r={5.6} />
              {names?.[i] && <Label p={cur} color={C.g} dx={8} dy={-8}>{names[i]}</Label>}
              {pointLabels && arrived && <Label p={p.end} color={C.g} dx={8} dy={16} size={11.5}>{`(${round(p.end.x)}, ${round(p.end.y)})`}</Label>}
            </g>
          )
        })}
      </Plane>
    </div>
  )
}

const round = (v: number) => String(Math.round(v * 100) / 100).replace('-', '−')

/** Static mini graph: parent dashed + g(x) solid. */
export function MiniGraph({ s, x = [-4, 4], y = [-4, 4], className = '' }: { s: Spec; x?: [number, number]; y?: [number, number]; className?: string }) {
  return (
    <Plane x={x} y={y} className={className} axisLabels={false}>
      <FLine m={1} b={0} dashed width={2.4} />
      <FLine m={slopeOf(s)} b={gOf(s, 0)} color={C.g} width={4} />
    </Plane>
  )
}
