// A transformation of the parent function f(x) = x, written the way the book groups it:
//   g(x) = A * f( B * (x - H) ) + K
// A and K are outside (vertical), B and H are inside, grouped with x (horizontal).
import { C } from './desmos'
import type { Expr } from '../components/Desmos'

export interface Spec {
  A: number
  B: number
  H: number
  K: number
}

export const spec = (p: Partial<Spec>): Spec => ({ A: 1, B: 1, H: 0, K: 0, ...p })

export const gOf = (s: Spec, x: number) => s.A * (s.B * (x - s.H)) + s.K
export const slopeOf = (s: Spec) => s.A * s.B
export const interceptOf = (s: Spec) => gOf(s, 0)

export interface Pt {
  x: number
  y: number
}

/** Where the parent point that ends at x = xt starts, and the corner of its path
 *  (horizontal part first, then the vertical part). */
export function journey(s: Spec, xt: number) {
  const x0 = s.B * (xt - s.H)
  const start: Pt = { x: x0, y: x0 }
  const mid: Pt = { x: xt, y: x0 }
  const end: Pt = { x: xt, y: gOf(s, xt) }
  return { start, mid, end }
}

/** Number to LaTeX, using a fraction when it is a simple one. */
export function tex(n: number): string {
  if (Number.isInteger(n)) return String(n)
  for (let d = 2; d <= 12; d++) {
    const num = n * d
    if (Math.abs(num - Math.round(num)) < 1e-9) {
      const k = Math.round(num)
      return `${k < 0 ? '-' : ''}\\frac{${Math.abs(k)}}{${d}}`
    }
  }
  return String(Math.round(n * 1000) / 1000)
}

/** Number for plain text: "3", "-2", "1/4", "1.5". */
export function plain(n: number): string {
  if (Number.isInteger(n)) return String(n)
  if (Math.abs(n * 10 - Math.round(n * 10)) < 1e-9) return String(Math.round(n * 10) / 10)
  for (let d = 2; d <= 12; d++) {
    const num = n * d
    if (Math.abs(num - Math.round(num)) < 1e-9) return `${Math.round(num)}/${d}`
  }
  return String(Math.round(n * 100) / 100)
}

/** Slope-intercept LaTeX for Desmos: y = m x + b */
export function lineLatex(m: number, b: number, v = 'x') {
  const mt = m === 1 ? '' : m === -1 ? '-' : tex(m)
  const bt = b === 0 ? '' : b > 0 ? `+${tex(b)}` : tex(b)
  return `y=${mt}${v}${bt}`
}

export const fmtPt = (p: Pt) => `(${plain(p.x)}, ${plain(p.y)})`
const ptTex = (p: Pt) => `\\left(${tex(p.x)},${tex(p.y)}\\right)`

interface ConvinceOpts {
  /** label the end points with their coordinates */
  labels?: boolean
  /** show g(x) (false lets a reveal hide it) */
  showG?: boolean
  /** show the movement arrows */
  showMoves?: boolean
  /** show the parent points */
  showStarts?: boolean
  idPrefix?: string
}

/** An arrow for Desmos: a parametric shaft plus a filled triangle head.
 *  `head` is the head length in graph units, or per-axis sizes for stretched windows. */
export function arrowExprs(id: string, from: Pt, to: Pt, color: string, head: number | { x: number; y: number }): Expr[] {
  const sx = typeof head === 'number' ? head : head.x
  const sy = typeof head === 'number' ? head : head.y
  // work in a space where the head is 1 unit on both axes, then map back
  const fx = from.x / sx
  const fy = from.y / sy
  const tx = to.x / sx
  const ty = to.y / sy
  const dx = tx - fx
  const dy = ty - fy
  const len = Math.hypot(dx, dy)
  if (len < 1e-9) return []
  const ux = dx / len
  const uy = dy / len
  const h = Math.min(1, len * 0.6)
  const bx = tx - ux * h
  const by = ty - uy * h
  const w = h * 0.55
  const X = (v: number) => tex(Math.round(v * sx * 1000) / 1000)
  const Y = (v: number) => tex(Math.round(v * sy * 1000) / 1000)
  return [
    {
      id: `${id}-shaft`,
      latex: `\\left(${X(fx)}+${X(bx - fx)}t,${Y(fy)}+${Y(by - fy)}t\\right)`,
      color,
      width: 3.5,
      domain: [0, 1],
    },
    {
      id: `${id}-head`,
      latex: `\\operatorname{polygon}\\left(\\left(${X(tx)},${Y(ty)}\\right),\\left(${X(bx - uy * w)},${Y(by + ux * w)}\\right),\\left(${X(bx + uy * w)},${Y(by - ux * w)}\\right)\\right)`,
      color,
      fill: 1,
      width: 1,
    },
  ]
}

/** Desmos expressions that show the parent, g(x), and how sample points travel. */
export function convinceExprs(s: Spec, xs: number[], o: ConvinceOpts = {}): Expr[] {
  const { labels = true, showG = true, showMoves = true, showStarts = true, idPrefix = 'c' } = o
  const v = fitView(journeyPoints(s, xs))
  const head = Math.max(v.x[1] - v.x[0], v.y[1] - v.y[0]) * 0.032
  const out: Expr[] = [
    { id: `${idPrefix}-f`, latex: 'y=x', color: C.parent, dashed: true, width: 2.5 },
  ]
  if (showG) out.push({ id: `${idPrefix}-g`, latex: lineLatex(slopeOf(s), interceptOf(s)), color: C.g, width: 4 })
  xs.forEach((xt, i) => {
    const { start, mid, end } = journey(s, xt)
    const movedH = Math.abs(mid.x - start.x) > 1e-9
    const movedV = Math.abs(end.y - mid.y) > 1e-9
    if (showMoves && movedH) out.push(...arrowExprs(`${idPrefix}-h${i}`, start, mid, C.horiz, head))
    if (showMoves && movedV) out.push(...arrowExprs(`${idPrefix}-v${i}`, mid, end, C.vert, head))
    if (showStarts) out.push({ id: `${idPrefix}-s${i}`, latex: ptTex(start), color: C.parent, pointSize: 9 })
    if (showG) out.push({ id: `${idPrefix}-e${i}`, latex: ptTex(end), color: C.g, pointSize: 11, label: labels ? fmtPt(end) : undefined })
  })
  return out
}

/** A comfortable window that contains the given points. */
export function fitView(pts: Pt[], pad = 1.5, min = 6): { x: [number, number]; y: [number, number] } {
  const xs = pts.map((p) => p.x).concat(0)
  const ys = pts.map((p) => p.y).concat(0)
  let x0 = Math.min(...xs) - pad
  let x1 = Math.max(...xs) + pad
  let y0 = Math.min(...ys) - pad
  let y1 = Math.max(...ys) + pad
  if (x1 - x0 < min) {
    const c = (x0 + x1) / 2
    x0 = c - min / 2
    x1 = c + min / 2
  }
  if (y1 - y0 < min) {
    const c = (y0 + y1) / 2
    y0 = c - min / 2
    y1 = c + min / 2
  }
  return { x: [x0, x1], y: [y0, y1] }
}

export function journeyPoints(s: Spec, xs: number[]): Pt[] {
  return xs.flatMap((x) => {
    const j = journey(s, x)
    return [j.start, j.mid, j.end]
  })
}
