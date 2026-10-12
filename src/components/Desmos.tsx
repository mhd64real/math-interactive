import { useEffect, useRef, useState } from 'react'
import { Move, RotateCcw } from 'lucide-react'
import { loadDesmos, squareBounds, type DesmosCalculator, type DesmosNS } from '../lib/desmos'

export interface Expr {
  id: string
  latex: string
  color?: string
  dashed?: boolean
  width?: number
  pointSize?: number
  label?: string
  labelPos?: 'ABOVE' | 'BELOW' | 'LEFT' | 'RIGHT' | 'ABOVE_LEFT' | 'ABOVE_RIGHT' | 'BELOW_LEFT' | 'BELOW_RIGHT'
  hidden?: boolean
  opacity?: number
  /** parametric domain for t, e.g. [0, 1] */
  domain?: [number, number]
  /** polygon fill opacity */
  fill?: number
}

export interface View {
  x: [number, number]
  y: [number, number]
}

interface Props {
  exprs: Expr[]
  view: View
  present?: boolean
  className?: string
  /** allow panning and zooming (off by default so a finger on the graph still scrolls the page on phones) */
  movable?: boolean
  ariaLabel?: string
  /** keep 1 unit the same length on both axes (off for real-world graphs) */
  square?: boolean
  xLabel?: string
  yLabel?: string
}

function toDesmos(D: DesmosNS, e: Expr) {
  const out: Record<string, unknown> = {
    id: e.id,
    latex: e.latex,
    color: e.color ?? '#2a2f3b',
    hidden: e.hidden ?? false,
    lineStyle: e.dashed ? D.Styles.DASHED : D.Styles.SOLID,
    lineWidth: e.width ?? 3,
    pointSize: e.pointSize ?? 9,
    secret: true,
  }
  if (e.opacity !== undefined) out.lineOpacity = e.opacity
  if (e.domain) out.parametricDomain = { min: String(e.domain[0]), max: String(e.domain[1]) }
  if (e.fill !== undefined) out.fillOpacity = e.fill
  if (e.label) {
    out.label = e.label
    out.showLabel = true
    out.labelOrientation = D.LabelOrientations[e.labelPos ?? 'RIGHT']
  } else {
    out.showLabel = false
  }
  return out
}

// One Desmos calculator is reused across steps (moved into whichever graph is on screen),
// so steps open faster and Desmos only boots once. A second one is made only if two
// graphs are on screen at the same time.
const BASE_OPTIONS = {
  expressions: false,
  settingsMenu: false,
  keypad: false,
  border: false,
  zoomButtons: false,
  showResetButtonOnGraphpaper: false,
  pointsOfInterest: true,
  trace: true,
  images: false,
  folders: false,
  notes: false,
  sliders: false,
  links: false,
  qwertyKeyboard: false,
}

interface Slot {
  el: HTMLDivElement
  calc: DesmosCalculator
  busy: boolean
}
const pool: Slot[] = []

function parking() {
  let h = document.getElementById('desmos-parking')
  if (!h) {
    h = document.createElement('div')
    h.id = 'desmos-parking'
    h.setAttribute('aria-hidden', 'true')
    h.style.cssText = 'position:fixed;left:-10000px;top:0;width:640px;height:420px;overflow:hidden;pointer-events:none;'
    document.body.appendChild(h)
  }
  return h
}

function acquire(D: DesmosNS): Slot {
  let slot = pool.find((x) => !x.busy)
  if (!slot) {
    const el = document.createElement('div')
    el.style.cssText = 'position:absolute;inset:0;'
    parking().appendChild(el)
    slot = { el, calc: D.GraphingCalculator(el, BASE_OPTIONS), busy: false }
    pool.push(slot)
  }
  slot.busy = true
  return slot
}

function release(slot: Slot, ids: string[]) {
  if (ids.length) slot.calc.removeExpressions(ids.map((id) => ({ id })))
  parking().appendChild(slot.el)
  slot.busy = false
}

export default function DesmosGraph({ exprs, view, present = false, className = '', movable = false, ariaLabel, square = true, xLabel, yLabel }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const calc = useRef<DesmosCalculator | null>(null)
  const ns = useRef<DesmosNS | null>(null)
  const ids = useRef<Set<string>>(new Set())
  const viewRef = useRef(view)
  viewRef.current = view
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [free, setFree] = useState(movable)

  const fit = () => {
    const el = host.current
    const c = calc.current
    if (!el || !c) return
    const v = viewRef.current
    c.setMathBounds(square ? squareBounds(v.x, v.y, el.clientWidth, el.clientHeight) : { left: v.x[0], right: v.x[1], bottom: v.y[0], top: v.y[1] })
  }

  // Borrow a calculator once.
  useEffect(() => {
    let alive = true
    let slot: Slot | null = null
    loadDesmos()
      .then((D) => {
        if (!alive || !host.current) return
        ns.current = D
        slot = acquire(D)
        host.current.appendChild(slot.el)
        calc.current = slot.calc
        slot.calc.updateSettings({
          lockViewport: !movable,
          projectorMode: present,
          fontSize: present ? 20 : 15,
          xAxisLabel: xLabel ?? '',
          yAxisLabel: yLabel ?? '',
        })
        slot.calc.resize()
        fit()
        setReady(true)
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
      if (slot) release(slot, [...ids.current])
      calc.current = null
      ids.current = new Set()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep expressions in sync with props.
  useEffect(() => {
    const c = calc.current
    const D = ns.current
    if (!ready || !c || !D) return
    const next = new Set(exprs.map((e) => e.id))
    const gone = [...ids.current].filter((id) => !next.has(id)).map((id) => ({ id }))
    if (gone.length) c.removeExpressions(gone)
    c.setExpressions(exprs.map((e) => toDesmos(D, e)))
    ids.current = next
  }, [exprs, ready])

  // Re-fit when the window changes or the box resizes.
  const viewKey = `${view.x.join(',')}|${view.y.join(',')}`
  useEffect(() => {
    if (!ready) return
    fit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey, ready])

  useEffect(() => {
    const el = host.current
    if (!el || !ready) return
    const ro = new ResizeObserver(() => {
      calc.current?.resize()
      fit()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ready])

  useEffect(() => {
    calc.current?.updateSettings({ lockViewport: !free })
  }, [free, ready])

  useEffect(() => {
    calc.current?.updateSettings({ projectorMode: present, fontSize: present ? 20 : 15 })
  }, [present, ready])

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-line bg-white ${className}`}>
      <div ref={host} className="absolute inset-0" role="img" aria-label={ariaLabel ?? 'Desmos graph'} />
      {!ready && !failed && (
        <div className="absolute inset-0 grid place-items-center text-sm font-bold text-muted">Loading Desmos...</div>
      )}
      {failed && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm font-bold text-muted">
          Desmos could not load. Check the internet connection and refresh the page.
        </div>
      )}
      {ready && (
        <div className="absolute right-2 top-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => setFree((f) => !f)}
            className={`grid h-9 w-9 place-items-center rounded-lg border text-ink-2 shadow-sm ${free ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-white/95'}`}
            aria-pressed={free}
            title={free ? 'Lock the graph' : 'Move and zoom the graph'}
            aria-label={free ? 'Lock the graph' : 'Move and zoom the graph'}
          >
            <Move size={18} />
          </button>
          <button
            type="button"
            onClick={fit}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-white/95 text-ink-2 shadow-sm"
            title="Reset the view"
            aria-label="Reset the view"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
