import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { loadDesmos, type DesmosCalculator } from '../lib/desmos'
import { read, write } from '../lib/store'

// The full Desmos calculator, preloaded with the lesson's family g(x) = a(x - h) + k,
// so students can explore without leaving the lesson. Whatever a student types is kept
// (closing the panel or refreshing brings it back) until they use Start over.
const SAVE_KEY = 'playground'
export default function Playground({ onClose, present }: { onClose: () => void; present: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let calc: DesmosCalculator | null = null
    let alive = true
    let save = () => {}
    loadDesmos()
      .then((D) => {
        if (!alive || !host.current) return
        calc = D.GraphingCalculator(host.current, {
          keypad: true,
          expressionsCollapsed: false,
          settingsMenu: true,
          zoomButtons: true,
          border: false,
          projectorMode: present,
          links: false,
        })
        calc.setExpressions([
          { id: 'f', latex: 'f\\left(x\\right)=x', color: '#2a2f3b', lineStyle: D.Styles.DASHED },
          { id: 'a', latex: 'a=1', sliderBounds: { min: '-4', max: '4', step: '0.25' } },
          { id: 'h', latex: 'h=0', sliderBounds: { min: '-6', max: '6', step: '1' } },
          { id: 'k', latex: 'k=0', sliderBounds: { min: '-6', max: '6', step: '1' } },
          { id: 'g', latex: 'g\\left(x\\right)=a\\left(x-h\\right)+k', color: '#2f9e44' },
        ])
        calc.setMathBounds({ left: -10, right: 10, bottom: -7, top: 7 })
        const saved = read<unknown>(SAVE_KEY, null)
        if (saved) {
          try {
            calc.setState(saved, { allowUndo: false })
          } catch {
            /* old or broken state, keep the starter graph */
          }
        }
        const c = calc
        let t = 0
        c.observeEvent('change', () => {
          window.clearTimeout(t)
          t = window.setTimeout(() => write(SAVE_KEY, c.getState()), 300)
        })
        save = () => {
          window.clearTimeout(t)
          write(SAVE_KEY, c.getState())
        }
      })
      .catch(() => alive && setFailed(true))
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const hide = () => save()
    window.addEventListener('keydown', k)
    window.addEventListener('pagehide', hide)
    return () => {
      window.removeEventListener('pagehide', hide)
      alive = false
      save()
      calc?.destroy()
      window.removeEventListener('keydown', k)
    }
  }, [onClose, present])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
        <div className="min-w-0">
          <div className="font-display text-lg font-extrabold leading-tight">Desmos</div>
          <div className="truncate text-xs font-bold text-muted">Drag the sliders for a, h and k and watch g(x) move.</div>
        </div>
        <button type="button" onClick={onClose} className="btn btn-primary min-h-10">
          <X size={18} /> Back to the lesson
        </button>
      </div>
      <div className="relative flex-1">
        <div ref={host} className="absolute inset-0" />
        {failed && <div className="absolute inset-0 grid place-items-center p-6 text-center font-bold text-muted">Desmos could not load. Check the internet connection.</div>}
      </div>
    </div>
  )
}
