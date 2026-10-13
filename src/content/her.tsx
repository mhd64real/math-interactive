import { useMemo, type ReactNode } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Building2, Car, Drill, MountainSnow, RotateCcw, Spool } from 'lucide-react'
import DesmosGraph, { type Expr } from '../components/Desmos'
import { Md, Tex } from '../components/Tex'
import { Choices, type Choice } from '../components/questions'
import { ExampleTag, Illus, Remember, SolutionTag, SubTopic, WarmUpTitle } from '../components/ui'
import { C } from '../lib/desmos'
import { usePersist } from '../lib/store'
import { arrowExprs, lineLatex, plain, spec, tex, type Spec } from '../lib/transform'
import { AnswerLine } from '../components/questions'
import { ConvinceGraph, graphBox, Legend, ParamSlider, Split, TagRow, type PartId, type SolLine, type StepDef } from './kit'

// Her lesson deck (M4L4), slide by slide: the solution wording, the examples and the
// intro cards she uses, rebuilt so every slide can be played with.

// ---------------- her solution wording ----------------

export type Move =
  | { kind: 'tr'; h: number; k: number }
  | { kind: 'vd'; a: number }
  | { kind: 'hd'; a: number }
  | { kind: 'rx'; a: number }
  | { kind: 'ry'; a: number }

const units = (n: number) => `${plain(Math.abs(n))} unit${Math.abs(n) === 1 ? '' : 's'}`

export function specOf(m: Move): Spec {
  switch (m.kind) {
    case 'tr':
      return spec({ H: m.h, K: m.k })
    case 'vd':
      return spec({ A: m.a })
    case 'hd':
      return spec({ B: m.a })
    case 'rx':
      return spec({ A: -m.a })
    case 'ry':
      return spec({ B: -m.a })
  }
}

/** The lines she writes under SOLUTION, and her final sentence. */
export function herSolution(m: Move, fn: string): { lines: SolLine[]; answer: string } {
  const g = `$g(x) = ${fn}$`
  if (m.kind === 'tr') {
    const { h, k } = m
    const hDir = h > 0 ? 'right' : 'left'
    const kDir = k > 0 ? 'up' : 'down'
    const hLine = `$\\hz{h} ${h > 0 ? '>' : '<'} 0$ so the graph of $f(x) = x$ is translated ${units(h)} ${hDir}.`
    const kLine = `$\\vt{k} ${k > 0 ? '>' : '<'} 0$ so the graph of $f(x) = x$ is translated ${units(k)} ${kDir}.`
    if (h !== 0 && k !== 0) {
      return {
        lines: [
          { text: `Since $f(x) = x$, $g(x) = f(x - \\hz{h}) + \\vt{k}$ where $\\hz{h} = \\hz{${tex(h)}}$ and $\\vt{k} = \\vt{${tex(k)}}$.` },
          { text: hLine, note: 'horizontal' },
          { text: kLine, note: 'vertical' },
        ],
        answer: `${g} is the translation of the graph of $f(x) = x$ **${units(h)} ${hDir} and ${units(k)} ${kDir}**.`,
      }
    }
    if (k !== 0) {
      return {
        lines: [
          { text: `Since $f(x) = x$, $g(x) = f(x) + \\vt{k}$ where $\\vt{k} = \\vt{${tex(k)}}$.` },
          { tex: `g(x) = ${fn}` },
          { tex: `g(x) = f(x) ${k > 0 ? '+' : '-'} \\vt{${tex(Math.abs(k))}}` },
          { text: kLine, note: 'vertical' },
        ],
        answer: `${g} is the translation of the graph of $f(x) = x$ **${units(k)} ${kDir}**.`,
      }
    }
    return {
      lines: [
        { text: `Since $f(x) = x$, $g(x) = f(x - \\hz{h})$ where $\\hz{h} = \\hz{${tex(h)}}$.` },
        { tex: `g(x) = ${fn}` },
        { tex: h > 0 ? `g(x) = f(x - \\hz{${tex(h)}})` : `g(x) = f(x - (\\hz{${tex(h)}}))` },
        { text: hLine, note: 'horizontal' },
      ],
      answer: `${g} is the translation of the graph of $f(x) = x$ **${units(h)} ${hDir}**.`,
    }
  }
  const a = m.a
  const big = a > 1
  const cmp = big ? '|a| > 1' : '0 < |a| < 1'
  const steep = big ? 'steeper' : 'less steep'
  if (m.kind === 'vd') {
    const word = big ? 'stretched' : 'compressed'
    return {
      lines: [
        { text: `Since $f(x) = x$, $g(x) = \\vt{a} \\cdot f(x)$ where $\\vt{a} = \\vt{${tex(a)}}$.` },
        { text: `$${cmp}$ so the graph of $f(x) = x$ is ${word} vertically by a factor of $${tex(a)}$.`, note: 'vertical' },
      ],
      answer: `${g} is a vertical ${big ? 'stretch' : 'compression'} of the graph of $f(x) = x$ by a factor of $${tex(a)}$. The slope of the graph $g(x)$ is **${steep}** than that of $f(x)$.`,
    }
  }
  if (m.kind === 'hd') {
    const word = big ? 'compressed' : 'stretched'
    const steepH = big ? 'steeper' : 'less steep'
    return {
      lines: [
        { text: `Since $f(x) = x$, $g(x) = f(\\hz{a} \\cdot x)$ where $\\hz{a} = \\hz{${tex(a)}}$.` },
        { text: `$${cmp}$ so the graph of $f(x) = x$ is ${word} horizontally by a factor of $${tex(1 / a)}$.`, note: 'horizontal' },
      ],
      answer: `${g} is a horizontal ${big ? 'compression' : 'stretch'} of the graph $f(x) = x$ by a factor of $${tex(1 / a)}$. The slope of the graph $g(x)$ is **${steepH}** than that of $f(x)$.`,
    }
  }
  if (m.kind === 'rx') {
    const word = big ? 'stretched' : 'compressed'
    return {
      lines: [
        { text: `Since $f(x) = x$, $g(x) = -1 \\cdot \\vt{a} \\cdot f(x)$ where $\\vt{a} = \\vt{${tex(a)}}$.` },
        { text: `$|a| ${big ? '> 1' : '< 1'}$ so the graph of $f(x) = x$ is vertically ${word}.`, note: 'vertical' },
        { text: 'The negative is **not grouped with $x$**, so the graph is also reflected across the $x$-axis.', note: 'across the $x$-axis' },
      ],
      answer: `The graph of ${g} is the graph of $f(x) = x$ **vertically ${word} by a factor of $${tex(a)}$ and reflected across the $x$-axis**.`,
    }
  }
  const word = big ? 'compressed' : 'stretched'
  return {
    lines: [
      { text: `Since $f(x) = x$, $g(x) = f(-1 \\cdot \\hz{a} \\cdot x)$ where $\\hz{a} = \\hz{${tex(a)}}$.` },
      { text: `$|a| ${big ? '> 1' : '< 1'}$ so the graph of $f(x) = x$ is horizontally ${word} by a factor of $${tex(1 / a)}$.`, note: 'horizontal' },
      { text: 'The negative is **grouped with $x$**, so the graph is also reflected across the $y$-axis.', note: 'across the $y$-axis' },
    ],
    answer: `The graph of ${g} is the graph of $f(x) = x$ **horizontally ${word} by a factor of $${tex(1 / a)}$ and reflected across the $y$-axis**.`,
  }
}

/** A "predict first" question for each kind of move. */
function predictOf(m: Move): { q: string; options: Choice[] } {
  if (m.kind === 'tr') {
    const { h, k } = m
    if (h !== 0 && k !== 0) {
      const opts = [
        [h > 0, k > 0],
        [h < 0, k > 0],
        [h > 0, k < 0],
        [h < 0, k < 0],
      ].map(([r, u]) => {
        const right = r === (h > 0) && u === (k > 0)
        return {
          text: `${units(h)} ${r ? 'right' : 'left'} and ${units(k)} ${u ? 'up' : 'down'}`,
          correct: right,
          why: right ? 'Inside the brackets the sign does the opposite; outside it does what it says.' : r !== (h > 0) ? `Look inside the brackets: $h = ${plain(h)}$.` : `Look outside the brackets: $k = ${plain(k)}$.`,
        }
      })
      return { q: 'Predict first: how will the graph move?', options: opts }
    }
    const n = h !== 0 ? h : k
    const answer = h !== 0 ? (h > 0 ? 'right' : 'left') : k > 0 ? 'up' : 'down'
    return {
      q: 'Predict first: which way will the graph move?',
      options: ['up', 'down', 'left', 'right'].map((d) => ({
        text: `${units(n)} ${d}`,
        correct: d === answer,
        why:
          d === answer
            ? h !== 0
              ? 'The number is **grouped with $x$**, so the graph moves sideways, the opposite way to the sign.'
              : 'The number is **not grouped with $x$**, so the graph moves up or down, the way its sign says.'
            : h !== 0
              ? (d === 'up' || d === 'down')
                ? 'The number is **grouped with $x$**: think left or right.'
                : 'Inside, the sign does the opposite of what it looks like.'
              : (d === 'left' || d === 'right')
                ? 'The number is **not grouped with $x$**: think up or down.'
                : `Check the sign: $k = ${plain(k)}$.`,
      })),
    }
  }
  if (m.kind === 'vd' || m.kind === 'hd') {
    const inside = m.kind === 'hd'
    const big = m.a > 1
    const answer = inside ? (big ? 'compressed horizontally' : 'stretched horizontally') : big ? 'stretched vertically' : 'compressed vertically'
    return {
      q: 'Predict first: what happens to the graph?',
      options: ['stretched vertically', 'compressed vertically', 'stretched horizontally', 'compressed horizontally'].map((t) => ({
        text: t,
        correct: t === answer,
        why:
          t === answer
            ? inside
              ? 'Grouped with $x$: horizontal. Inside does the opposite, so a big $a$ squeezes and a small $a$ stretches.'
              : 'Not grouped with $x$: vertical. A big $|a|$ stretches, a small one compresses.'
            : t.endsWith(inside ? 'vertically' : 'horizontally')
              ? `Is $a$ grouped with $x$? ${inside ? 'Yes, so the dilation is horizontal.' : 'No, so the dilation is vertical.'}`
              : `Compare $|a| = ${plain(m.a)}$ with $1$${inside ? ', and remember inside does the opposite' : ''}.`,
      })),
    }
  }
  const across = m.kind === 'rx' ? 'x' : 'y'
  return {
    q: 'Predict first: the graph is reflected across...',
    options: ['x', 'y'].map((ax) => ({
      text: `the $${ax}$-axis`,
      correct: ax === across,
      why:
        ax === across
          ? across === 'x'
            ? 'The negative is **not grouped with $x$**: every $y$-value changes sign.'
            : 'The negative is **grouped with $x$**: every $x$-value changes sign.'
          : 'Where is the negative sign: inside, grouped with $x$, or outside?',
    })),
  }
}

// ---------------- her EXAMPLE slide ----------------

export interface HerExampleDef {
  id: string
  part: PartId
  num: number
  page: string
  topic?: string
  instruction: string
  fn: string
  move: Move
  xs: number[]
}

function HerExampleBody({ d, reveal, present }: { d: HerExampleDef; reveal: number; present: boolean }) {
  const sol = useMemo(() => herSolution(d.move, d.fn), [d])
  const s = useMemo(() => specOf(d.move), [d])
  const pr = useMemo(() => predictOf(d.move), [d])
  const total = sol.lines.length + 1
  const shown = Math.min(reveal, sol.lines.length)
  const done = reveal >= total
  return (
    <Split
      present={present}
      left={
        <>
          {d.topic && <SubTopic>{d.topic}</SubTopic>}
          <TagRow page={d.page}>
            <ExampleTag />
          </TagRow>
          <p className="font-display text-[1.1rem] font-extrabold leading-snug text-ink">
            <Md>{d.instruction}</Md>
          </p>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[1.45rem] font-extrabold text-primary">{d.num}.</span>
            <span className="problem text-[1.5rem]">
              <Tex>{`g(x) = ${d.fn}`}</Tex>
            </span>
          </div>
          {reveal === 0 && (
            <div className="space-y-2 rounded-2xl border-2 border-dashed border-line p-3">
              <div className="font-extrabold text-ink">{pr.q}</div>
              <Choices id={`${d.id}-predict`} options={pr.options} columns={2} />
            </div>
          )}
          {reveal > 0 && <SolutionTag />}
          {reveal > 0 && <SolLines lines={sol.lines} shown={shown} />}
          {done && <AnswerLine>{sol.answer}</AnswerLine>}
        </>
      }
      right={<ConvinceGraph s={s} xs={d.xs} present={present} showG={done || shown >= sol.lines.length} showMoves={done || shown >= sol.lines.length} />}
    />
  )
}

/** Her solution: plain lines, no boxes, the way she writes them on the slide. */
export function SolLines({ lines, shown }: { lines: SolLine[]; shown: number }) {
  return (
    <ol className="space-y-2">
      {lines.slice(0, shown).map((l, i) => (
        <li key={i} className="flex animate-[rise_320ms_ease-out] flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-l-[3px] border-primary/30 pl-3">
          <div className="min-w-0 text-[1.1rem] font-semibold leading-relaxed text-ink">
            {l.tex && <Tex>{l.tex}</Tex>}
            {l.text && <Md>{l.text}</Md>}
          </div>
          {l.note && (
            <span className="text-[0.88rem] font-extrabold text-muted">
              <Md>{l.note}</Md>
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}

/** Plain-text version of a LaTeX function for titles: "\\left(\\frac{3}{4}x\\right)" to "(3/4x)". */
export const fnPlain = (fn: string) =>
  fn
    .replace(/\\frac\{(\d+)\}\{(\d+)\}/g, '$1/$2')
    .replace(/\\left|\\right/g, '')
    .replace(/[{}\\]/g, '')

export function herExampleStep(d: HerExampleDef): StepDef {
  const n = herSolution(d.move, d.fn).lines.length + 1
  return {
    id: d.id,
    part: d.part,
    title: `Example #${d.num}: g(x) = ${fnPlain(d.fn)}`,
    page: d.page,
    reveals: n,
    revealLabel: 'Next line',
    render: ({ reveal, present }) => <HerExampleBody d={d} reveal={reveal} present={present} />,
  }
}

// ---------------- warm up: transformations in real life ----------------

type Kind = 'translation' | 'reflection' | 'rotation' | 'dilation'
const KINDS: Kind[] = ['translation', 'reflection', 'rotation', 'dilation']
const KIND_COLOR: Record<Kind, string> = { translation: 'text-l4', reflection: 'text-l1', rotation: 'text-l3', dilation: 'text-l6' }
const KIND_ANIM: Record<Kind, string> = {
  translation: 'animate-[wu-slide_1.6s_ease-in-out_infinite]',
  reflection: 'animate-[wu-flip_1.8s_ease-in-out_infinite]',
  rotation: 'animate-[wu-spin_1.6s_linear_infinite]',
  dilation: 'animate-[wu-grow_1.6s_ease-in-out_infinite]',
}

const REAL: { text: string; answer: Kind; icon: ReactNode; why: Partial<Record<Kind, string>> }[] = [
  { text: 'Using a screwdriver to attach a screw', answer: 'rotation', icon: <Drill size={34} />, why: { translation: 'The screw goes in, but watch the handle: it turns around and around.', reflection: 'Nothing is mirrored here. What does your wrist do?', dilation: 'The screw stays the same size.' } },
  { text: 'Using a sewing machine to sew a seam', answer: 'translation', icon: <Spool size={34} />, why: { rotation: 'The fabric does not turn. It slides along in a straight line.', reflection: 'Nothing is flipped: the fabric just slides.', dilation: 'The fabric keeps its size.' } },
  { text: 'The image of a mountain on the surface of a lake', answer: 'reflection', icon: <MountainSnow size={34} />, why: { translation: 'The image is upside down, like in a mirror.', rotation: 'Close, it looks upside down. But it is a mirror image across the water line.', dilation: 'The image is the same size, just flipped.' } },
  { text: 'Architectural models', answer: 'dilation', icon: <Building2 size={34} />, why: { translation: 'The model is not moved. It is a smaller copy of the real building.', reflection: 'The model is not flipped, it is shrunk.', rotation: 'The model is not turned, it is scaled down.' } },
  { text: 'The movement of cars down a highway', answer: 'translation', icon: <Car size={34} />, why: { rotation: 'The wheels rotate, but the car itself slides along the road.', reflection: 'Nothing is mirrored.', dilation: 'The car keeps its size as it moves.' } },
]

function RealLife({ reveal, present }: { reveal: number; present: boolean }) {
  const [picks, setPicks] = usePersist<Record<number, Kind[]>>('wu-real', {})
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <WarmUpTitle />
          <h2 className="font-display text-[1.5rem] font-extrabold italic text-[#2f9e44] sm:text-[1.7rem]">Geometric Transformations in Real Life</h2>
          <p className="text-[1.08rem] font-bold text-ink">
            Does each situation describe a <span className="text-l4">Translation</span>, a <span className="text-l1">Reflection</span>, a <span className="text-l3">Rotation</span>, or a <span className="text-l6">Dilation</span>?
          </p>
        </div>
        <Illus name="warmup" className={`shrink-0 ${present ? 'h-24 w-24' : 'h-24 w-24 sm:h-32 sm:w-32'}`} />
      </div>
      <ol className={present ? 'space-y-1.5' : 'space-y-2.5'}>
        {REAL.map((r, i) => {
          const tried = picks[i] ?? []
          const shown = present ? reveal > i : false
          const solved = shown || tried.includes(r.answer)
          const last = tried[tried.length - 1]
          return (
            <li key={r.text} className={`rounded-2xl border-2 bg-white ${present ? 'px-3 py-1.5' : 'p-3'} ${solved ? 'border-good/40' : 'border-line'}`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`grid ${present ? 'h-11 w-11' : 'h-14 w-14'} shrink-0 place-items-center rounded-xl bg-canvas ${solved ? `${KIND_COLOR[r.answer]} ${KIND_ANIM[r.answer]}` : 'text-ink-2'}`}>{r.icon}</span>
                <span className="min-w-[12rem] flex-1 text-[1.12rem] font-bold text-ink">
                  {i + 1}. {r.text}
                </span>
                {solved ? (
                  <span className={`font-display text-[1.35rem] font-extrabold ${KIND_COLOR[r.answer]}`}>{r.answer}</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {KINDS.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setPicks((p) => ({ ...p, [i]: [...(p[i] ?? []), k] }))}
                        className={`rounded-xl border-2 px-2.5 py-1 text-[0.92rem] font-extrabold ${tried.includes(k) ? 'border-bad/40 bg-bad-soft text-bad line-through' : 'border-line bg-white text-ink-2 hover:border-primary/40'}`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!solved && last && last !== r.answer && r.why[last] && <p className="mt-2 pl-[4.25rem] font-bold text-bad">{r.why[last]}</p>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export const warmReal: StepDef = {
  id: 'warmup-real',
  part: 'warmup',
  title: 'Warm Up: transformations in real life',
  reveals: (m) => (m === 'present' ? REAL.length : 0),
  revealLabel: 'Show next answer',
  render: ({ reveal, present }) => <RealLife reveal={reveal} present={present} />,
}

// ---------------- learn cards (her "Learn ..." infographics) ----------------

function LearnCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[1.4rem] border-[3px] border-[#e8496a]/60 bg-white shadow-sm">
      <header className="flex items-center gap-3 bg-[#fde7ec] px-4 py-2">
        <span className="rounded-lg bg-[#e8496a] px-2.5 pt-0.5 font-display text-[0.95rem] font-extrabold uppercase leading-7 tracking-wide text-white">Learn</span>
        <h3 className="font-display text-[1.3rem] font-extrabold leading-tight text-ink">{title}</h3>
      </header>
      <div className="space-y-3 p-4">{children}</div>
    </section>
  )
}

function Row({ tone, label, children }: { tone: 'blue' | 'yellow' | 'green' | 'pink'; label?: string; children: ReactNode }) {
  const t = { blue: 'border-[#9cc3ec] bg-[#eef6ff]', yellow: 'border-[#f0d58c] bg-[#fffbea]', green: 'border-[#a7d8a0] bg-[#effaee]', pink: 'border-[#f3b6c4] bg-[#fff1f4]' }[tone]
  const l = { blue: 'bg-[#2a9fb8]', yellow: 'bg-[#d59a00]', green: 'bg-[#4caf50]', pink: 'bg-[#e8496a]' }[tone]
  return (
    <div className={`rounded-xl border-2 ${t} px-3.5 py-2.5`}>
      {label && <span className={`mb-1 inline-block rounded-md ${l} px-2 font-display text-[0.8rem] font-extrabold uppercase leading-6 tracking-wide text-white`}>{label}</span>}
      <div className="text-[1.02rem] leading-relaxed text-ink">{typeof children === 'string' ? <Md>{children}</Md> : children}</div>
    </div>
  )
}

/** Slide 5: translations of linear functions + a pad to slide the parent function around. */
function TrIntroBody({ present }: { present: boolean }) {
  const [p, setP] = usePersist<{ h: number; k: number }>('tr-intro-pad', { h: 0, k: 0 })
  const exprs = useMemo<Expr[]>(() => {
    const out: Expr[] = [
      { id: 'f', latex: 'y=x', color: C.parent, dashed: true, width: 2.6 },
      { id: 'g', latex: lineLatex(1, p.k - p.h), color: C.g, width: 4 },
    ]
    if (p.h !== 0 || p.k !== 0) {
      ;[-2, 2].forEach((x) => {
        if (p.h !== 0) out.push(...arrowExprs(`h${x}`, { x, y: x }, { x: x + p.h, y: x }, C.horiz, 0.35))
        if (p.k !== 0) out.push(...arrowExprs(`k${x}`, { x: x + p.h, y: x }, { x: x + p.h, y: x + p.k }, C.vert, 0.35))
      })
      out.push({ id: 'pt', latex: `\\left(${p.h},${p.k}\\right)`, color: C.g, pointSize: 11, label: `(0, 0) moved to (${p.h}, ${p.k})`, labelPos: 'BELOW_RIGHT' })
    }
    return out
  }, [p])
  const move = (dh: number, dk: number) => setP((q) => ({ h: Math.max(-5, Math.min(5, q.h + dh)), k: Math.max(-5, Math.min(5, q.k + dk)) }))
  const eq = `g(x) = ${p.h === 0 ? 'x' : `(x ${p.h > 0 ? '-' : '+'} \\hz{${Math.abs(p.h)}})`}${p.k === 0 ? '' : ` ${p.k > 0 ? '+' : '-'} \\vt{${Math.abs(p.k)}}`}`
  const btn = 'grid h-12 w-12 place-items-center rounded-xl border-2 border-line bg-white text-ink-2 shadow-sm active:scale-95'
  return (
    <Split
      present={present}
      left={
        <>
          <LearnCard title="Translations of Linear Functions">
            <Row tone="blue">{'A **family of graphs** includes graphs and equations of graphs that have at least one characteristic in common. The **parent function** is the simplest of the functions in a family.'}</Row>
            <Row tone="yellow">{'The family of **linear functions** includes all lines, with the parent function $f(x) = x$, also called the **identity function**. A **transformation** moves the graph on the coordinate plane, which can create new linear functions.'}</Row>
            <Row tone="green" label="One type of transformation: translation">{'A **translation** is a transformation in which a figure is slid from one position to another without being turned. A linear function can be slid up, down, left, right, or in two directions.'}</Row>
          </LearnCard>
          <Remember>A **translation** slides the graph without changing its shape or slope.</Remember>
        </>
      }
      right={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border-2 border-line bg-white p-3">
            <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Slide the line">
              <span />
              <button type="button" className={btn} onClick={() => move(0, 1)} aria-label="Slide up"><ArrowUp size={22} strokeWidth={3} className="text-vert" /></button>
              <span />
              <button type="button" className={btn} onClick={() => move(-1, 0)} aria-label="Slide left"><ArrowLeft size={22} strokeWidth={3} className="text-horiz" /></button>
              <button type="button" className={btn} onClick={() => setP({ h: 0, k: 0 })} aria-label="Back to the parent function"><RotateCcw size={18} /></button>
              <button type="button" className={btn} onClick={() => move(1, 0)} aria-label="Slide right"><ArrowRight size={22} strokeWidth={3} className="text-horiz" /></button>
              <span />
              <button type="button" className={btn} onClick={() => move(0, -1)} aria-label="Slide down"><ArrowDown size={22} strokeWidth={3} className="text-vert" /></button>
              <span />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="font-extrabold text-ink">Slide the parent function</div>
              <div className="text-[1.3rem]">
                <Tex>{eq}</Tex>
              </div>
              <div className="font-bold text-good">
                <Md>{'Slope is still $1$: same shape, same steepness.'}</Md>
              </div>
            </div>
          </div>
          <DesmosGraph exprs={exprs} view={{ x: [-7, 7], y: [-7, 7] }} present={present} className={present ? 'h-[25rem]' : 'h-[min(60vw,20rem)] sm:h-[22rem]'} ariaLabel="Slide the parent function" />
          <Legend items={[['f(x) = x', C.parent, true], ['g(x)', C.g], ['left / right', C.horiz], ['up / down', C.vert]]} />
        </div>
      }
    />
  )
}

export function trIntro(part: PartId): StepDef {
  return { id: 'tr-intro', part, title: 'Learn: translations of linear functions', render: ({ present }) => <TrIntroBody present={present} /> }
}

/** Slide 13: her Transformations Guide, with h and k sliders. */
function GuideBody({ present }: { present: boolean }) {
  const [h, setH] = usePersist('guide-h', 3)
  const [k, setK] = usePersist('guide-k', 0)
  const s = useMemo(() => spec({ H: h, K: k }), [h, k])
  const hTxt = h === 0 ? 'No horizontal move.' : `$h = ${h}$ ${h > 0 ? `is positive $(x - ${h})$: graph translates **RIGHT ${h}** units.` : `is negative $(x + ${-h})$: graph translates **LEFT ${-h}** units.`}`
  const kTxt = k === 0 ? 'No vertical move.' : `$k = ${k}$ ${k > 0 ? `is positive $(+${k})$: graph translates **UP ${k}** units.` : `is negative $(${k})$: graph translates **DOWN ${-k}** units.`}`
  const eq = `g(x) = ${h === 0 ? 'x' : `(x ${h > 0 ? '-' : '+'} \\hz{${Math.abs(h)}})`}${k === 0 ? '' : ` ${k > 0 ? '+' : '-'} \\vt{${Math.abs(k)}}`}`
  return (
    <Split
      present={present}
      left={
        <>
          <SubTopic>Multiple Translations of Linear Functions</SubTopic>
          <section className="space-y-3 rounded-[1.4rem] border-2 border-line bg-[#fbf8f1] p-4">
            <div className="text-center font-display text-[1.25rem] font-extrabold uppercase leading-tight tracking-wide text-ink">
              Transformations Guide: <span className="block text-[1.05rem]">From Parent to New Function</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="rounded-xl border-2 border-[#9cc3ec] bg-[#eef6ff] px-3 py-1.5 text-center">
                <div className="text-[0.75rem] font-extrabold uppercase tracking-wider text-ink-2">The parent function</div>
                <div className="text-[1.35rem]"><Tex>{'f(x) = x'}</Tex></div>
              </div>
              <ArrowRight className="text-primary" />
              <div className="rounded-xl border-2 border-[#f0d58c] bg-[#fffbea] px-3 py-1.5 text-center">
                <div className="text-[0.75rem] font-extrabold uppercase tracking-wider text-ink-2">The transformed function</div>
                <div className="text-[1.35rem]"><Tex>{'g(x) = (x - \\hz{h}) + \\vt{k}'}</Tex></div>
              </div>
            </div>
            <div className={`grid gap-3 ${present ? 'grid-cols-2' : 'sm:grid-cols-2'}`}>
              <div className={`rounded-xl border-2 p-3 transition-shadow ${h !== 0 ? 'border-horiz shadow-[0_0_0_3px_rgb(28_126_214/0.15)]' : 'border-horiz/30'} bg-white`}>
                <div className="font-display font-extrabold text-horiz">Horizontal Translate</div>
                <div className="text-[0.95rem] font-bold text-ink">Step 1: "h" (Inside Parentheses)</div>
                <div className="text-[0.92rem] text-ink-2"><Md>{'Moves the graph left or right. Inside changes $x$.'}</Md></div>
                <div className="mt-1.5 rounded-lg bg-horiz-soft px-2 py-1 text-[0.95rem] text-ink"><Md>{hTxt}</Md></div>
              </div>
              <div className={`rounded-xl border-2 p-3 transition-shadow ${k !== 0 ? 'border-vert shadow-[0_0_0_3px_rgb(214_51_132/0.15)]' : 'border-vert/30'} bg-white`}>
                <div className="font-display font-extrabold text-vert">Vertical Translate</div>
                <div className="text-[0.95rem] font-bold text-ink">Step 2: "k" (Outside Parentheses)</div>
                <div className="text-[0.92rem] text-ink-2"><Md>{'Moves the graph up or down. Outside changes $y$.'}</Md></div>
                <div className="mt-1.5 rounded-lg bg-vert-soft px-2 py-1 text-[0.95rem] text-ink"><Md>{kTxt}</Md></div>
              </div>
            </div>
          </section>
        </>
      }
      right={
        <div className="space-y-3">
          <div className="rounded-2xl bg-canvas px-4 py-2.5 text-center text-[1.5rem]">
            <Tex>{eq}</Tex>
          </div>
          <ParamSlider name="h" value={h} min={-5} max={5} step={1} onChange={setH} color="h" />
          <ParamSlider name="k" value={k} min={-5} max={5} step={1} onChange={setK} color="v" />
          <ConvinceGraph s={s} xs={[-2, 1]} present={present} view={{ x: [-7, 7], y: [-7, 7] }} />
        </div>
      }
    />
  )
}

export function guideStep(part: PartId): StepDef {
  return { id: 'tr-guide', part, title: 'Transformations Guide', render: ({ present }) => <GuideBody present={present} /> }
}

/** Slide 17: learn dilations, with a slider for a and an inside / outside switch. */
function DiIntroBody({ present }: { present: boolean }) {
  const [a, setA] = usePersist('di-intro-a', 2)
  const [inside, setInside] = usePersist('di-intro-in', false)
  const s = useMemo(() => (inside ? spec({ B: a }) : spec({ A: a })), [a, inside])
  const big = a > 1
  const word = a === 1 ? 'not changed' : inside ? (big ? 'compressed horizontally' : 'stretched horizontally') : big ? 'stretched vertically' : 'compressed vertically'
  const eq = inside ? `g(x) = (\\hz{${tex(a)}}x)` : `g(x) = \\vt{${tex(a)}}(x)`
  const xs = inside ? (a > 1 ? [-1.5, 1.5] : [-3, 3]) : a > 1 ? [-1.5, 1.5] : [-4, 4]
  return (
    <Split
      present={present}
      left={
        <>
          <LearnCard title="Learn Dilations of Linear Functions">
            <div className="rounded-xl border-[3px] border-[#2a9fb8]/50 bg-[#effbfd] px-4 py-5 text-center font-display text-[1.45rem] font-extrabold leading-snug text-ink">A dilation stretches or compresses the graph of a function.</div>
            <Row tone="yellow">{'Multiply **outside** ($a \\cdot f(x)$): the $y$-values change, so the dilation is **vertical**.'}</Row>
            <Row tone="blue">{'Multiply **inside** ($f(a \\cdot x)$, grouped with $x$): the $x$-values change, so the dilation is **horizontal**.'}</Row>
          </LearnCard>
        </>
      }
      right={
        <div className="space-y-3">
          <div className="inline-flex rounded-2xl border-2 border-line bg-canvas p-1" role="tablist">
            {[false, true].map((v) => (
              <button key={String(v)} type="button" role="tab" aria-selected={inside === v} onClick={() => setInside(v)} className={`rounded-xl px-4 py-1.5 font-extrabold ${inside === v ? 'bg-white text-primary shadow-sm' : 'text-ink-2'}`}>
                {v ? 'Inside: f(a · x)' : 'Outside: a · f(x)'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-canvas px-4 py-2.5">
            <span className="text-[1.5rem]"><Tex>{eq}</Tex></span>
            <span className={`font-extrabold ${inside ? 'text-horiz' : 'text-vert'}`}>{word}</span>
          </div>
          <ParamSlider name="a" value={a} min={0.25} max={4} step={0.25} onChange={setA} color={inside ? 'h' : 'v'} format={(v) => tex(v)} />
          <ConvinceGraph s={s} xs={xs} present={present} view={{ x: [-5, 5], y: [-5, 5] }} />
        </div>
      }
    />
  )
}

export function diIntro(part: PartId): StepDef {
  return { id: 'di-intro', part, title: 'Learn: dilations of linear functions', render: ({ present }) => <DiIntroBody present={present} /> }
}

/** Slide 25: learn reflections, with a point you move and flip. */
function ReIntroBody({ present }: { present: boolean }) {
  const [px, setPx] = usePersist('re-intro-x', 3)
  const [py, setPy] = usePersist('re-intro-y', 2)
  const [flip, setFlip] = usePersist<'x' | 'y' | ''>('re-intro-flip', '')
  const img = flip === 'x' ? { x: px, y: -py } : flip === 'y' ? { x: -px, y: py } : null
  const exprs = useMemo<Expr[]>(() => {
    const out: Expr[] = [{ id: 'P', latex: `\\left(${px},${py}\\right)`, color: C.parent, pointSize: 13, label: `(${px}, ${py})`, labelPos: 'ABOVE_RIGHT' }]
    if (img) {
      out.push({ id: 'Q', latex: `\\left(${img.x},${img.y}\\right)`, color: C.g, pointSize: 13, label: `(${img.x}, ${img.y})`, labelPos: 'BELOW_RIGHT' })
      out.push(...arrowExprs('m', { x: px, y: py }, img, flip === 'x' ? C.vert : C.horiz, 0.35))
      out.push({ id: 'mirror', latex: flip === 'x' ? 'y=0\\left\\{-6<x<6\\right\\}' : 'x=0\\left\\{-6<y<6\\right\\}', color: '#e8496a', width: 5, opacity: 0.45 })
    }
    return out
  }, [px, py, flip, img])
  const bt = (on: boolean) => `btn ${on ? 'btn-primary' : 'btn-ghost'}`
  return (
    <Split
      present={present}
      left={
        <>
          <LearnCard title="Reflections of Linear Functions">
            <Row tone="pink">{'A **reflection** is a transformation in which a figure, line, or curve, is flipped across a line.'}</Row>
            <Row tone="blue" label="Key Rule">{'When a linear function $f(x)$ is multiplied by $-1$ before or after it has been evaluated, the result is a **reflection** across the $x$- or $y$-axis.'}</Row>
            <Row tone="green" label="Coordinate Effect">
              <Md>{'Every $x$- or $y$-coordinate of $f(x)$ is multiplied by $-1$.'}</Md>
              <div className="mt-2 flex flex-wrap gap-2 text-[1.05rem]">
                <span className="rounded-lg border-2 border-vert/40 bg-white px-2 py-0.5"><Tex>{'(x, y) \\rightarrow (x, \\vt{-y})'}</Tex></span>
                <span className="rounded-lg border-2 border-horiz/40 bg-white px-2 py-0.5"><Tex>{'(x, y) \\rightarrow (\\hz{-x}, y)'}</Tex></span>
              </div>
            </Row>
          </LearnCard>
          <Remember>Multiply by $-1$ to flip the graph across an **axis**!</Remember>
        </>
      }
      right={
        <div className="space-y-3">
          <div className="font-extrabold text-ink">Pick a point, then flip it:</div>
          <ParamSlider name="x" value={px} min={-5} max={5} step={1} onChange={setPx} color="h" />
          <ParamSlider name="y" value={py} min={-5} max={5} step={1} onChange={setPy} color="v" />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={bt(flip === 'x')} onClick={() => setFlip(flip === 'x' ? '' : 'x')}>
              Multiply y by −1
            </button>
            <button type="button" className={bt(flip === 'y')} onClick={() => setFlip(flip === 'y' ? '' : 'y')}>
              Multiply x by −1
            </button>
          </div>
          {img && (
            <div className="rounded-xl bg-canvas px-3 py-2 font-bold text-ink">
              <Md>{`$(${px}, ${py}) \\rightarrow (${img.x}, ${img.y})$: flipped across the **${flip === 'x' ? 'x' : 'y'}-axis**.`}</Md>
            </div>
          )}
          <DesmosGraph exprs={exprs} view={{ x: [-6, 6], y: [-6, 6] }} present={present} className={present ? 'h-[22rem]' : graphBox(false)} ariaLabel="A point and its reflection" />
        </div>
      }
    />
  )
}

export function reIntro(part: PartId): StepDef {
  return { id: 're-intro', part, title: 'Learn: reflections of linear functions', render: ({ present }) => <ReIntroBody present={present} /> }
}

