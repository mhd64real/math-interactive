import { useMemo, type ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import DesmosGraph, { type Expr, type View } from '../components/Desmos'
import { Md, Tex } from '../components/Tex'
import { AnswerLine } from '../components/questions'
import { ExampleTag, PagePill, SubTopic, ThinkReveal, WatchOut } from '../components/ui'
import { C } from '../lib/desmos'
import { convinceExprs, fitView, journeyPoints, lineLatex, type Spec } from '../lib/transform'

export type Mode = 'learn' | 'present'

export type PartId =
  | 'start'
  | 'warmup'
  | 'vocab'
  | 'outcomes'
  | 'explore'
  | 'translations'
  | 'dilations'
  | 'reflections'
  | 'journey'
  | 'takeaways'
  | 'mixed'
  | 'hot'
  | 'close'

export interface StepCtx {
  mode: Mode
  present: boolean
  /** how many reveal stages are showing (0 = none) */
  reveal: number
  go: (id: string) => void
  next: () => void
  switchMode: (m: Mode) => void
  /** has the student reached the end of this part */
  done: (part: PartId) => boolean
}

export interface StepDef {
  id: string
  part: PartId
  title: string
  page?: string
  /** number of reveal stages the Next button walks through before leaving the step */
  reveals?: number | ((m: Mode) => number)
  /** label for the Next button while stages remain */
  revealLabel?: string
  render: (c: StepCtx) => ReactNode
}

export const PARTS: Record<PartId, { title: string; pill?: string; outcome?: number }> = {
  start: { title: 'Get ready' },
  warmup: { title: 'Warm Up', pill: 'Warm Up' },
  vocab: { title: 'New Vocabulary', pill: 'New Vocabulary' },
  outcomes: { title: 'Learning Outcomes', pill: '4-4 Transformations of Linear Functions' },
  explore: { title: 'Explore with Desmos', pill: 'Explore: Transforming Linear Functions' },
  translations: { title: 'Translations', pill: 'Learning Outcome: Apply translations to linear functions', outcome: 0 },
  dilations: { title: 'Dilations', pill: 'Learning Outcome: Apply dilations to linear functions', outcome: 1 },
  reflections: { title: 'Reflections', pill: 'Learning Outcome: Apply reflections to linear functions', outcome: 2 },
  journey: { title: 'Same line, different journey', pill: 'Watch Out! Same line, different journey' },
  takeaways: { title: 'Key Takeaways', pill: 'Key Takeaways' },
  mixed: { title: 'Mixed Exercises', pill: 'Mixed Exercises' },
  hot: { title: 'H.O.T. Problems', pill: 'Learning Outcome: H.O.T. Problems' },
  close: { title: 'Wrap up' },
}

export const OUTCOMES = [
  'Apply translations to linear functions.',
  'Apply dilations to linear functions.',
  'Apply reflections to linear functions.',
]

// ---------------- layout ----------------

/** Text on the left, graph on the right (her slide layout). Stacks on phones. */
export function Split({ left, right, graphFirst = false, present }: { left: ReactNode; right: ReactNode; graphFirst?: boolean; present?: boolean }) {
  return (
    <div className={`grid items-start gap-5 ${present ? 'grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-8' : 'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-8'}`}>
      <div className={`min-w-0 space-y-4 ${graphFirst && !present ? 'order-2 lg:order-1' : ''}`}>{left}</div>
      <div className={`min-w-0 ${present ? 'sticky top-0' : 'lg:sticky lg:top-24'} ${graphFirst && !present ? 'order-1 lg:order-2' : ''}`}>{right}</div>
    </div>
  )
}

export function TagRow({ children, page }: { children: ReactNode; page?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2.5">{children}</div>
      {page && <PagePill page={page} />}
    </div>
  )
}

export function graphBox(present: boolean) {
  return present ? 'h-[33rem]' : 'h-[min(60vw,22rem)] sm:h-[24rem] lg:h-[28rem]'
}

// ---------------- table (her blue header table) ----------------

export function ValueTable({ head, rows, hl = -1 }: { head: string[]; rows: string[][]; hl?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[18rem] border-collapse overflow-hidden rounded-xl text-center text-[1rem] shadow-[0_0_0_2px_#2e6bc6]">
        <thead>
          <tr className="bg-[#2e6bc6] text-white">
            {head.map((h, i) => (
              <th key={i} className="border border-[#2e6bc6] px-2 py-1.5 font-bold [&_.katex]:text-white">
                <Tex>{h}</Tex>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="bg-white">
              {r.map((c, j) => (
                <td key={j} className={`border border-[#b9cfee] px-2 py-1.5 ${j === hl ? 'font-bold text-g' : 'text-ink'}`}>
                  <Tex>{c}</Tex>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------- worked solution, revealed line by line ----------------

export interface SolLine {
  tex?: string
  text?: string
  note?: string
}

export function Solution({ lines, shown }: { lines: SolLine[]; shown: number }) {
  return (
    <ol className="space-y-2.5">
      {lines.slice(0, shown).map((l, i) => (
        <li key={i} className="animate-[rise_320ms_ease-out] rounded-xl border border-line bg-white px-3 py-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div className="min-w-0 text-[1.08rem] font-semibold text-ink">
              {l.tex && <Tex>{l.tex}</Tex>}
              {l.text && <Md>{l.text}</Md>}
            </div>
            {l.note && (
              <div className="text-[0.95rem] font-bold text-horiz">
                <Md>{l.note}</Md>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

// ---------------- graphs ----------------

export function ConvinceGraph({ s, xs, present, extra = [], view, showG = true, showMoves = true, label, box }: { s: Spec; xs: number[]; present: boolean; extra?: Expr[]; view?: View; showG?: boolean; showMoves?: boolean; label?: string; box?: string }) {
  const exprs = useMemo(() => [...convinceExprs(s, xs, { showG, showMoves }), ...extra], [s, xs, showG, showMoves, extra])
  const v = useMemo(() => view ?? fitView(journeyPoints(s, xs)), [view, s, xs])
  return (
    <div>
      <DesmosGraph exprs={exprs} view={v} present={present} className={present && box ? box : graphBox(present)} ariaLabel={label} />
      <Legend />
    </div>
  )
}

export function Legend({ items }: { items?: [string, string, boolean?][] }) {
  const list: [string, string, boolean?][] = items ?? [
    ['f(x) = x', C.parent, true],
    ['g(x)', C.g],
    ['moves horizontally', C.horiz],
    ['moves vertically', C.vert],
  ]
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.82rem] font-bold text-ink-2">
      {list.map(([t, c, dashed]) => (
        <span key={t} className="inline-flex items-center gap-1.5">
          <svg width="22" height="8" aria-hidden>
            <line x1="1" y1="4" x2="21" y2="4" stroke={c} strokeWidth="3.5" strokeDasharray={dashed ? '5 4' : undefined} strokeLinecap="round" />
          </svg>
          <Md>{t}</Md>
        </span>
      ))}
    </div>
  )
}

/** Desmos with two plain lines (used for the real-world examples), drawn for v >= 0. */
export function TwoLines({ f, g, v = 'x', view, present, extra = [], names = ['f', 'g'], xLabel, yLabel, box }: { f: [number, number]; g: [number, number]; v?: string; view: View; present: boolean; extra?: Expr[]; names?: [string, string]; xLabel?: string; yLabel?: string; box?: string }) {
  const exprs = useMemo<Expr[]>(
    () => [
      { id: 'tl-f', latex: `${lineLatex(f[0], f[1])}\\left\\{x\\ge0\\right\\}`, color: C.parent, dashed: true, width: 2.8 },
      { id: 'tl-g', latex: `${lineLatex(g[0], g[1])}\\left\\{x\\ge0\\right\\}`, color: C.g, width: 4 },
      ...extra,
    ],
    [f, g, extra],
  )
  return (
    <div>
      <DesmosGraph exprs={exprs} view={view} present={present} className={present && box ? box : graphBox(present)} square={false} xLabel={xLabel} yLabel={yLabel} />
      <Legend items={[[`${names[0]}(${v})`, C.parent, true], [`${names[1]}(${v})`, C.g]]} />
    </div>
  )
}

// ---------------- slider ----------------

export function ParamSlider({ name, value, min, max, step, onChange, color, format }: { name: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; color: 'v' | 'h' | 'g'; format?: (v: number) => string }) {
  const col = color === 'v' ? 'accent-vert text-vert' : color === 'h' ? 'accent-horiz text-horiz' : 'accent-g text-g'
  const bump = (d: number) => onChange(Math.min(max, Math.max(min, Math.round((value + d) / step) * step)))
  return (
    <div className="rounded-2xl border-2 border-line bg-white px-3 py-2.5">
      <div className="flex items-center gap-3">
        <span className={`min-w-[4.6rem] text-[1.25rem] font-extrabold ${col}`}>
          <Tex>{`${name} = ${format ? format(value) : String(value).replace('-', '-')}`}</Tex>
        </span>
        <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-line bg-canvas text-ink-2" onClick={() => bump(-step)} aria-label={`Decrease ${name}`}>
          <Minus size={18} strokeWidth={3} />
        </button>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className={`h-10 min-w-0 flex-1 ${col}`} aria-label={`${name} slider`} />
        <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-line bg-canvas text-ink-2" onClick={() => bump(step)} aria-label={`Increase ${name}`}>
          <Plus size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  )
}

// ---------------- worked example step ----------------

export interface ExampleDef {
  id: string
  part: PartId
  n: number | string
  topic: string
  title: string
  page: string
  problem: string
  lines: SolLine[]
  answer: string
  table?: { head: string[]; rows: string[][] }
  /** reveal stage at which g(x) and the arrows appear on the graph (default: the last line) */
  graphAt?: number
  spec: Spec
  xs: number[]
  think?: { title?: string; text: string; answer: string }
  watch?: string
  extraGraph?: Expr[]
  view?: View
}

export function exampleStep(d: ExampleDef): StepDef {
  const total = d.lines.length + 1
  return {
    id: d.id,
    part: d.part,
    title: `Textbook Example ${d.n}: ${d.title}`,
    page: d.page,
    reveals: total,
    render: ({ reveal, present }) => {
      const shown = Math.min(reveal, d.lines.length)
      const graphAt = d.graphAt ?? d.lines.length
      return (
        <Split
          present={present}
          left={
            <>
              <SubTopic>{d.topic}</SubTopic>
              <TagRow page={d.page}>
                <ExampleTag n={d.n} />
                <span className="rounded-full border-2 border-line px-2 text-[0.75rem] font-extrabold uppercase tracking-wide text-muted">Textbook</span>
                <span className="font-display text-[1.15rem] font-extrabold text-ink">{d.title}</span>
              </TagRow>
              <p className="text-[1.1rem] font-bold leading-relaxed text-ink">
                <span className="problem">
                  <Md>{d.problem}</Md>
                </span>
              </p>
              <Solution lines={d.lines} shown={shown} />
              {reveal >= total && <AnswerLine>{d.answer}</AnswerLine>}
              {reveal >= total && d.think && <ThinkReveal title={d.think.title} text={d.think.text} answer={d.think.answer} forceOpen={present} />}
              {reveal >= total && d.watch && <WatchOut>{d.watch}</WatchOut>}
            </>
          }
          right={
            <div className="space-y-3">
              {d.table && reveal >= 1 && <ValueTable head={d.table.head} rows={d.table.rows} hl={d.table.head.length - 1} />}
              <ConvinceGraph s={d.spec} xs={d.xs} present={present} showG={reveal >= graphAt} showMoves={reveal >= graphAt} extra={d.extraGraph} view={d.view} box={d.table ? 'h-[25rem]' : undefined} />
            </div>
          }
        />
      )
    },
  }
}
