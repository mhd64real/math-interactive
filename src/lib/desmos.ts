// Loads the Desmos API once and exposes a minimal typed surface.
// The demo key works for development; set VITE_DESMOS_KEY to a production key
// (requested free from desmos.com/my-api) before wide use.
const KEY = (import.meta.env.VITE_DESMOS_KEY as string | undefined) || 'dcb31709b452b1cf9dc26972add0fda6'
const SRC = `https://www.desmos.com/api/v1.13/calculator.js?apiKey=${KEY}`

export interface DesmosCalculator {
  setExpression(e: Record<string, unknown>): void
  setExpressions(e: Record<string, unknown>[]): void
  removeExpressions(e: { id: string }[]): void
  setMathBounds(b: { left: number; right: number; bottom: number; top: number }): void
  updateSettings(s: Record<string, unknown>): void
  setDefaultState(state: unknown): void
  getState(): unknown
  resize(): void
  destroy(): void
}

export interface DesmosNS {
  GraphingCalculator(el: HTMLElement, opts?: Record<string, unknown>): DesmosCalculator
  Styles: { SOLID: string; DASHED: string; DOTTED: string; POINT: string; OPEN: string }
  LabelOrientations: Record<'DEFAULT' | 'ABOVE' | 'BELOW' | 'LEFT' | 'RIGHT' | 'ABOVE_LEFT' | 'ABOVE_RIGHT' | 'BELOW_LEFT' | 'BELOW_RIGHT', string>
  DragModes: Record<'NONE' | 'X' | 'Y' | 'XY' | 'AUTO', string>
}

declare global {
  interface Window {
    Desmos?: DesmosNS
  }
}

let pending: Promise<DesmosNS> | null = null

export function loadDesmos(): Promise<DesmosNS> {
  if (window.Desmos) return Promise.resolve(window.Desmos)
  if (!pending) {
    pending = new Promise<DesmosNS>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = SRC
      s.async = true
      s.onload = () => (window.Desmos ? resolve(window.Desmos) : reject(new Error('Desmos did not initialise')))
      s.onerror = () => {
        pending = null
        s.remove()
        reject(new Error('Desmos could not load'))
      }
      document.head.appendChild(s)
    })
  }
  return pending
}

// Same hex values as the CSS tokens, for the places (Desmos, SVG) that need literals.
export const C = {
  parent: '#2a2f3b',
  g: '#2f9e44',
  vert: '#d63384',
  horiz: '#1c7ed6',
  answer: '#cf4b14',
  muted: '#8a93a6',
  grid: '#e7eaf1',
  axis: '#9aa2b1',
} as const

/** Expand a target window so that one unit has the same length on both axes. */
export function squareBounds(
  x: [number, number],
  y: [number, number],
  width: number,
  height: number,
) {
  const w = Math.max(width, 1)
  const h = Math.max(height, 1)
  const perPx = Math.max((x[1] - x[0]) / w, (y[1] - y[0]) / h)
  const cx = (x[0] + x[1]) / 2
  const cy = (y[0] + y[1]) / 2
  return {
    left: cx - (perPx * w) / 2,
    right: cx + (perPx * w) / 2,
    bottom: cy - (perPx * h) / 2,
    top: cy + (perPx * h) / 2,
  }
}
