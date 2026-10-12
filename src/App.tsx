import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ChartLine, Check, ChevronLeft, ChevronRight, Eye, List, Maximize, Minimize, Presentation, X } from 'lucide-react'
import { steps } from './content'
import { PARTS, type Mode, type PartId } from './content/kit'
import { OutcomePill, PagePill } from './components/ui'
import { TimerButton, TimerOverlay } from './components/Timer'
import Playground from './components/Playground'
import ResetButton from './components/ResetButton'
import { usePersist } from './lib/store'
import { loadDesmos } from './lib/desmos'

function parseHash(): { mode: Mode; id: string } {
  const m = /^#\/(learn|present)\/([\w-]+)/.exec(window.location.hash)
  if (m && steps.some((s) => s.id === m[2])) return { mode: m[1] as Mode, id: m[2] }
  return { mode: 'learn', id: steps[0].id }
}

function todayLabel() {
  const d = new Date()
  const wd = d.toLocaleDateString('en-GB', { weekday: 'long' })
  const rest = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${wd}, ${rest}`
}

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  if (!el) return false
  return el.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) || !!el.closest?.('.dcg-container')
}

if (import.meta.env.DEV) {
  // exposed for the screenshot checks during development
  ;(window as unknown as { __steps: unknown }).__steps = steps.map((s) => ({ id: s.id, learn: typeof s.reveals === 'function' ? s.reveals('learn') : (s.reveals ?? 0), present: typeof s.reveals === 'function' ? s.reveals('present') : (s.reveals ?? 0) }))
}

export default function App() {
  const [{ mode, id }, setRoute] = useState(parseHash)
  const [reveals, setReveals] = useState<Record<string, number>>({})
  const [menu, setMenu] = useState(false)
  const [play, setPlay] = useState(false)
  const [timer, setTimer] = useState<number | null>(null)
  const [full, setFull] = useState(false)
  const [visited, setVisited] = usePersist<string[]>('visited', [])

  const index = Math.max(0, steps.findIndex((s) => s.id === id))
  const step = steps[index]
  const present = mode === 'present'
  const stagesFor = (i: number) => {
    const r = steps[i].reveals
    return typeof r === 'function' ? r(mode) : (r ?? 0)
  }
  const stages = stagesFor(index)
  const reveal = Math.min(reveals[step.id] ?? 0, stages)

  // warm the Desmos script while the student reads the intro
  useEffect(() => {
    loadDesmos().catch(() => undefined)
  }, [])

  useEffect(() => {
    const on = () => setRoute(parseHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('present', present)
  }, [present])

  useEffect(() => {
    if (!visited.includes(step.id)) setVisited((v) => (v.includes(step.id) ? v : [...v, step.id]))
    if (!present) window.scrollTo({ top: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id])

  const go = useCallback(
    (to: string, m: Mode = mode, revealTo?: number) => {
      if (revealTo !== undefined) setReveals((r) => ({ ...r, [to]: revealTo }))
      window.location.hash = `#/${m}/${to}`
    },
    [mode],
  )

  const next = useCallback(() => {
    if (reveal < stages) {
      setReveals((r) => ({ ...r, [step.id]: reveal + 1 }))
      return
    }
    if (index < steps.length - 1) go(steps[index + 1].id)
    else go(steps[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal, stages, index, step.id, go])

  const prev = useCallback(() => {
    if (present && reveal > 0) {
      setReveals((r) => ({ ...r, [step.id]: reveal - 1 }))
      return
    }
    if (index > 0) go(steps[index - 1].id, mode, stagesFor(index - 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [present, reveal, index, step.id, go, mode])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (isTyping(e.target) || menu || play || timer !== null) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (present && (e.key === ' ' || e.key === 'Enter'))) {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        prev()
      } else if (present && e.key === 'Escape' && !document.fullscreenElement) {
        go(step.id, 'learn')
      } else if (present && (e.key === 'f' || e.key === 'F')) {
        toggleFull()
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined)
    else document.documentElement.requestFullscreen?.().catch(() => undefined)
  }

  const done = useCallback(
    (p: PartId) => {
      const inPart = steps.filter((s) => s.part === p)
      return inPart.length > 0 && visited.includes(inPart[inPart.length - 1].id)
    },
    [visited],
  )
  const ctx = useMemo(
    () => ({ mode, present, reveal, go: (to: string) => go(to), next, switchMode: (m: Mode) => go(step.id, m), done }),
    [mode, present, reveal, go, next, step.id, done],
  )
  const part = PARTS[step.part]
  const date = useMemo(todayLabel, [])
  const last = index === steps.length - 1
  const nextLabel = reveal < stages ? (step.revealLabel ?? 'Next step') : last ? 'Back to the start' : 'Continue'

  const menuEl = menu && <Menu current={step.id} visited={visited} mode={mode} onClose={() => setMenu(false)} onGo={(sid) => { setMenu(false); go(sid) }} />
  const playEl = play && <Playground present={present} onClose={() => setPlay(false)} />
  const timerEl = timer !== null && <TimerOverlay seconds={timer} onClose={() => setTimer(null)} />

  if (present) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-white">
        <div className="relative overflow-hidden bg-white" style={{ width: 'min(100vw, calc(100dvh * 16 / 9))', height: 'min(100dvh, calc(100vw * 9 / 16))' }}>
          {/* left vertical tab, like her slides */}
          <div className="absolute bottom-[3.6rem] left-[0.9rem] top-[4.2rem] flex w-[2.1rem] items-center justify-center rounded-md border-2 border-tab-ink/30 bg-tab">
            <span className="whitespace-nowrap font-display text-[1rem] font-extrabold text-tab-ink [writing-mode:vertical-rl] rotate-180">4-4 Transformations of Linear Functions</span>
          </div>
          <div className="absolute left-[4rem] right-[1.4rem] top-[0.9rem] flex items-start justify-between gap-4">
            <div className="min-w-0">{part.pill ? <OutcomePill>{part.pill}</OutcomePill> : <span />}</div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="text-[0.8rem] font-extrabold text-date">{date}</span>
              {step.page && <PagePill page={step.page} />}
            </div>
          </div>
          <main className="absolute bottom-[3.8rem] left-[4rem] right-[1.6rem] top-[4.4rem] overflow-y-auto overflow-x-hidden pr-1">
            <div key={step.id} className="animate-[rise_260ms_ease-out]">{step.render(ctx)}</div>
          </main>
          <div className="absolute bottom-[0.8rem] left-[4rem] right-[1.4rem] flex items-center justify-between gap-3">
            <span className="text-[0.8rem] font-bold text-muted">
              {index + 1} / {steps.length} &middot; {part.title}
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl border border-line bg-white/95 p-1 shadow-sm">
              <TimerButton seconds={60} onStart={setTimer} compact />
              <TimerButton seconds={120} onStart={setTimer} compact />
              <DockBtn label="Desmos" onClick={() => setPlay(true)}><ChartLine size={18} /></DockBtn>
              <DockBtn label="Lesson map" onClick={() => setMenu(true)}><List size={18} /></DockBtn>
              <DockBtn label={full ? 'Exit full screen' : 'Full screen'} onClick={toggleFull}>{full ? <Minimize size={18} /> : <Maximize size={18} />}</DockBtn>
              <DockBtn label="Back" onClick={prev}><ChevronLeft size={20} /></DockBtn>
              <button type="button" onClick={next} className="inline-flex h-9 items-center gap-1 rounded-xl bg-primary px-3 text-[0.85rem] font-extrabold text-white hover:bg-primary-hover">
                {reveal < stages ? <Eye size={16} /> : null}
                {nextLabel}
                <ChevronRight size={18} />
              </button>
              <DockBtn label="Leave present mode" onClick={() => go(step.id, 'learn')}><X size={18} /></DockBtn>
            </div>
          </div>
        </div>
        {menuEl}
        {playEl}
        {timerEl}
      </div>
    )
  }

  const progress = ((index + 1) / steps.length) * 100

  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-30 border-b border-line bg-white/92 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <button type="button" onClick={() => go(steps[0].id)} className="flex min-w-0 items-center gap-2.5 text-left">
            <span className="shrink-0 rounded-md border-2 border-tab-ink/25 bg-tab px-1.5 font-display text-[0.95rem] font-extrabold leading-6 text-tab-ink">4-4</span>
            <span className="truncate font-display text-[1.05rem] font-extrabold text-ink">Transformations of Linear Functions</span>
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <HeadBtn label="Open Desmos" onClick={() => setPlay(true)}><ChartLine size={19} /><span className="hidden md:inline">Desmos</span></HeadBtn>
            <HeadBtn label="Present mode" onClick={() => go(step.id, 'present')} className="hidden sm:inline-flex"><Presentation size={19} /><span className="hidden md:inline">Present</span></HeadBtn>
            <HeadBtn label="Lesson map" onClick={() => setMenu(true)}><List size={19} /><span className="hidden md:inline">Lesson map</span></HeadBtn>
          </div>
        </div>
        <div className="h-1.5 w-full bg-canvas">
          <div className="h-full rounded-r-full bg-outcome-edge transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-4 sm:pt-6">
        {(part.pill || step.page) && step.part !== 'start' && (
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">{part.pill && <OutcomePill>{part.pill}</OutcomePill>}</div>
            <span className="hidden shrink-0 text-[0.78rem] font-extrabold text-date sm:inline">{date}</span>
          </div>
        )}
        <div key={step.id} className="card animate-[rise_260ms_ease-out] p-4 sm:p-6">
          {step.render(ctx)}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center gap-3 px-4">
          <button type="button" className="btn btn-ghost" onClick={prev} disabled={index === 0} aria-label="Back">
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <span className="mx-auto min-w-0 truncate text-center text-[0.85rem] font-bold text-muted">
            {index + 1} / {steps.length} <span className="hidden sm:inline">&middot; {part.title}</span>
          </span>
          <button type="button" className="btn btn-primary min-w-[9.5rem]" onClick={next}>
            {nextLabel}
            {reveal < stages ? <Eye size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </nav>
      {menuEl}
      {playEl}
      {timerEl}
    </div>
  )
}

function HeadBtn({ children, label, onClick, className = '' }: { children: React.ReactNode; label: string; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-[0.9rem] font-extrabold text-ink-2 hover:bg-canvas ${className}`}>
      {children}
    </button>
  )
}

function DockBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className="grid h-9 w-9 place-items-center rounded-xl text-ink-2 hover:bg-canvas">
      {children}
    </button>
  )
}

function Menu({ current, visited, mode, onClose, onGo }: { current: string; visited: string[]; mode: Mode; onClose: () => void; onGo: (id: string) => void }) {
  const groups = useMemo(() => {
    const out: { part: PartId; items: typeof steps }[] = []
    steps.forEach((s) => {
      const last = out[out.length - 1]
      if (last && last.part === s.part) last.items.push(s)
      else out.push({ part: s.part, items: [s] })
    })
    return out
  }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30" onClick={onClose}>
      <aside className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} aria-label="Lesson map">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <div className="font-display text-lg font-extrabold">Lesson map</div>
            <div className="text-xs font-bold text-muted">{mode === 'present' ? 'Present mode' : 'Tap any step to jump there'}</div>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-canvas" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {groups.map((g) => (
            <div key={g.part} className="mb-3">
              <div className="px-2 pb-1 font-display text-[0.95rem] font-extrabold text-tab-ink">{PARTS[g.part].title}</div>
              {g.items.map((s) => {
                const isCur = s.id === current
                const seen = visited.includes(s.id)
                return (
                  <button key={s.id} type="button" onClick={() => onGo(s.id)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[0.9rem] font-semibold ${isCur ? 'bg-primary-soft text-primary' : 'text-ink-2 hover:bg-canvas'}`}>
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${seen ? 'border-good bg-good text-white' : 'border-line'}`}>{seen && <Check size={12} strokeWidth={4} />}</span>
                    <span className="min-w-0 truncate">{s.title}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <span className="text-xs font-bold text-muted">Answers are saved on this device.</span>
          <ResetButton />
        </div>
      </aside>
    </div>
  )
}
