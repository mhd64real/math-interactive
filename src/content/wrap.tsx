import { useMemo, useState } from 'react'
import { Check, Star } from 'lucide-react'
import DesmosGraph, { type Expr } from '../components/Desmos'
import { Md, Tex } from '../components/Tex'
import { Choices, FunctionAnswer, Sentence } from '../components/questions'
import { TransformDemo } from '../components/Plane'
import { H2, Illus, KeyTakeawaysTag, P, PagePill, Remember, SubTopic, WatchOut, Bubble } from '../components/ui'
import { C } from '../lib/desmos'
import { usePersist } from '../lib/store'
import ResetButton from '../components/ResetButton'
import { lineLatex, spec, type Spec } from '../lib/transform'
import { graphBox, Legend, OUTCOMES, Split, type StepDef } from './kit'
import { describe, dilationQ, practiceStep, translationQ, useSolved } from './practice'
import { fnPlain } from './her'

// ---------------- same line, different journey ----------------

const PAIRS: { key: string; label: string; out: { fn: string; s: Spec; say: string }; inn: { fn: string; s: Spec; say: string } }[] = [
  {
    key: 'translate',
    label: 'Translate',
    out: { fn: 'x + 3', s: spec({ K: 3 }), say: 'outside: every point moves **3 up**' },
    inn: { fn: '(x + 3)', s: spec({ H: -3 }), say: 'inside: every point moves **3 left**' },
  },
  {
    key: 'dilate',
    label: 'Dilate',
    out: { fn: '2(x)', s: spec({ A: 2 }), say: 'outside: **stretched vertically**, points move up and down' },
    inn: { fn: '(2x)', s: spec({ B: 2 }), say: 'inside: **compressed horizontally**, points move sideways' },
  },
  {
    key: 'reflect',
    label: 'Reflect',
    out: { fn: '-(x)', s: spec({ A: -1 }), say: 'outside: flipped across the **x-axis**' },
    inn: { fn: '(-x)', s: spec({ B: -1 }), say: 'inside: flipped across the **y-axis**' },
  },
]

function JourneyBody({ reveal, present }: { reveal: number; present: boolean }) {
  const [k, setK] = useState(0)
  const pair = PAIRS[k]
  const combo = useMemo<Expr[]>(
    () => [
      { id: 'f', latex: 'y=x', color: C.parent, dashed: true, width: 2.6 },
      { id: 'g1', latex: lineLatex(2, 6), color: C.vert, width: 4 },
      { id: 'g2', latex: lineLatex(2, 3), color: C.horiz, width: 4 },
    ],
    [],
  )
  const xs = pair.key === 'dilate' ? [-1.5, 1, 2] : [-2, 1, 2.5]
  const names = ['A', 'B', 'C']
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SubTopic>Same line, different journey</SubTopic>
        <PagePill page="P.239" />
      </div>
      <H2>For $f(x) = x$, outside and inside can land on the same line</H2>
      <P>Pick a pair. Both graphs end on the **same green line**, but follow the points $A$, $B$ and $C$: they travel a different path.</P>
      <div className="inline-flex rounded-2xl border-2 border-line bg-canvas p-1" role="tablist">
        {PAIRS.map((p, i) => (
          <button key={p.key} type="button" role="tab" aria-selected={i === k} onClick={() => setK(i)} className={`rounded-xl px-4 py-1.5 font-extrabold ${i === k ? 'bg-white text-primary shadow-sm' : 'text-ink-2'}`}>
            {p.label}
          </button>
        ))}
      </div>
      <div className={`grid gap-4 ${present ? 'grid-cols-[1fr_1fr_1.15fr]' : 'sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.15fr]'}`}>
        {[pair.out, pair.inn].map((side, i) => (
          <figure key={side.fn} className={`rounded-2xl border-2 bg-white p-3 ${i === 0 ? 'border-vert/40' : 'border-horiz/40'}`}>
            <div className="mb-1 text-center text-[1.3rem]">
              <Tex>{`g(x) = ${side.fn}`}</Tex>
            </div>
            <TransformDemo key={`${pair.key}-${i}`} s={side.s} xs={xs} names={names} x={[-5, 5]} y={[-5, 5]} className={`mx-auto w-full ${present ? 'max-w-[15rem]' : 'max-w-[18rem]'}`} />
            <figcaption className={`pt-1 text-center text-[0.95rem] font-semibold ${i === 0 ? 'text-vert' : 'text-horiz'}`}>
              <Md>{side.say}</Md>
            </figcaption>
          </figure>
        ))}
        <div className={`space-y-3 ${present ? '' : 'sm:col-span-2 lg:col-span-1'}`}>
          <div className="rounded-2xl bg-canvas p-4 font-display text-[1.35rem] font-extrabold leading-tight text-ink">Same line. Different journey.</div>
          <WatchOut>
            {'When a transformation is the **only one** performed on the identity function, doing it before or after evaluating the function has the same effect on the graph. However, when **more than one type** of transformation is applied, this will not be the case.'}
          </WatchOut>
          {(present ? reveal >= 1 : true) && (
            <div className="space-y-2">
              <P>{'Two transformations: $2(x + 3)$ is $2x + 6$, but $(2x) + 3$ is $2x + 3$. Different lines!'}</P>
              <DesmosGraph exprs={combo} view={{ x: [-6, 4], y: [-4, 8] }} present={present} className="h-56" ariaLabel="Two different lines" />
              <Legend items={[['f(x) = x', C.parent, true], ['2(x + 3)', C.vert], ['(2x) + 3', C.horiz]]} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const journey: StepDef = {
  id: 'journey',
  part: 'journey',
  title: 'Same line, different journey',
  page: 'P.239',
  reveals: (m) => (m === 'present' ? 1 : 0),
  revealLabel: 'Show two transformations',
  render: ({ reveal, present }) => <JourneyBody reveal={reveal} present={present} />,
}

// ---------------- key takeaways ----------------

const ROWS: { fn: string; grouped: boolean; what: string; s: Spec; xs: number[] }[] = [
  { fn: 'x + k', grouped: false, what: '**Translated vertically.** $k > 0$: up. $k < 0$: down.', s: spec({ K: 2 }), xs: [-2, 0, 2] },
  { fn: '(x - h)', grouped: true, what: '**Translated horizontally.** $h > 0$: right. $h < 0$: left.', s: spec({ H: 2 }), xs: [-1, 1, 3] },
  { fn: 'a(x)', grouped: false, what: '**Dilated vertically.** $|a| > 1$: stretched. $0 < |a| < 1$: compressed.', s: spec({ A: 2 }), xs: [-1.5, 1, 2] },
  { fn: '(ax)', grouped: true, what: '**Dilated horizontally.** $|a| > 1$: compressed. $0 < |a| < 1$: stretched.', s: spec({ B: 2 }), xs: [-1.5, 1, 2] },
  { fn: '-(x)', grouped: false, what: '**Reflected across the x-axis.** Every $y$ changes sign.', s: spec({ A: -1 }), xs: [-2, 1, 3] },
  { fn: '(-x)', grouped: true, what: '**Reflected across the y-axis.** Every $x$ changes sign.', s: spec({ B: -1 }), xs: [-2, 1, 3] },
]

function Takeaways({ reveal, present }: { reveal: number; present: boolean }) {
  const shown = present ? reveal : ROWS.length
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <KeyTakeawaysTag />
        <Bubble text="SUMMARY" className="text-[1.6rem]" />
      </div>
      <div className={`grid gap-3 ${present ? 'grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {ROWS.map((r, i) => (
          <div key={r.fn} className={`flex items-center gap-3 rounded-2xl border-2 bg-white p-3 transition-opacity ${r.grouped ? 'border-horiz/35' : 'border-vert/35'} ${i < shown ? 'opacity-100' : 'opacity-0'}`}>
            <TransformDemo s={r.s} xs={r.xs} x={[-4, 4]} y={[-4, 4]} className={`${present ? 'w-[7.5rem]' : 'w-28'} shrink-0`} />
            <div className="min-w-0 space-y-1">
              <div className="text-[1.2rem]">
                <Tex>{`g(x) = ${r.fn}`}</Tex>
              </div>
              <span className={`inline-block rounded-full px-2 text-[0.8rem] font-extrabold ${r.grouped ? 'bg-horiz-soft text-horiz' : 'bg-vert-soft text-vert'}`}>{r.grouped ? 'grouped with x: horizontal' : 'not grouped: vertical'}</span>
              <div className="text-[0.95rem] leading-snug text-ink-2">
                <Md>{r.what}</Md>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Remember>**Grouped with $x$** (inside) changes the $x$-values: horizontal. **Not grouped** (outside) changes the $y$-values: vertical. Inside does the opposite of what it looks like.</Remember>
    </div>
  )
}

const takeaways: StepDef = {
  id: 'takeaways',
  part: 'takeaways',
  title: 'Key Takeaways',
  reveals: (m) => (m === 'present' ? ROWS.length : 0),
  revealLabel: 'Show next row',
  render: ({ reveal, present }) => <Takeaways reveal={reveal} present={present} />,
}

// ---------------- mixed exercises ----------------

type Kind = 'Translation' | 'Dilation' | 'Dilation and reflection'
const KINDS: Kind[] = ['Translation', 'Dilation', 'Dilation and reflection']
const kindWhy: Record<Kind, string> = {
  Translation: 'A translation **adds** a number (inside or outside). Is anything multiplied here?',
  Dilation: 'A dilation **multiplies** by a positive number. Look for a negative sign too.',
  'Dilation and reflection': 'A reflection needs a **negative** multiplier. Is there one here?',
}

function mixed(n: number, page: string, fn: string, kind: Kind, q: ReturnType<typeof translationQ>, s: Spec, xs: number[], answer: string) {
  return practiceStep({
    id: `mx-${n}`,
    part: 'mixed',
    title: `Mixed #${n}: g(x) = ${fnPlain(fn)}`,
    page,
    num: String(n),
    topic: 'Mixed Exercises',
    prompt: `Describe the transformation in $g(x) = ${fn}$ as it relates to the graph of the parent function.`,
    q: (revealed) => (
      <div className="space-y-3">
        <div className="font-extrabold text-ink">First: what kind of transformation is it?</div>
        <Choices
          id={`mx-${n}-kind`}
          revealed={revealed}
          columns={1}
          options={KINDS.map((k) => ({ text: k, correct: k === kind, why: k === kind ? 'Now describe it.' : kindWhy[k] }))}
          after={<Sentence id={`mx-${n}`} revealed={revealed} parts={q.parts} blanks={q.blanks} hints={['Is the constant grouped with $x$? Write the general form first.']} />}
        />
      </div>
    ),
    solvedBy: `mx-${n}`,
    graph: { s, xs },
    answer,
  })
}

// #22 to #27 are her homework (P.249), so the site practises the neighbours instead.
const mx12 = mixed(12, 'P.248', '1.5(x)', 'Dilation', dilationQ(1.5, false), spec({ A: 1.5 }), [-2, 2], 'The graph of $g(x) = 1.5(x)$ is the parent function **stretched vertically**.')
const mx17 = mixed(17, 'P.248', '-8(x)', 'Dilation and reflection', dilationQ(-8, false), spec({ A: -8 }), [-0.5, 0.5], 'The graph of $g(x) = -8(x)$ is the parent function **stretched vertically and reflected across the x-axis**.')
const mx21 = mixed(21, 'P.249', '(-1.5x)', 'Dilation and reflection', dilationQ(-1.5, true), spec({ B: -1.5 }), [-2, 2], 'The graph of $g(x) = (-1.5x)$ is the parent function **compressed horizontally and reflected across the y-axis**.')

const mx28 = practiceStep({
  id: 'mx-28',
  part: 'mixed',
  title: 'Mixed #28: write g(x)',
  page: 'P.250',
  num: '28',
  topic: 'Reasoning',
  prompt: 'Write a function $g(x)$ to represent the translated graph: $f(x) = 3x + 7$ translated 4 units up.',
  q: (revealed) => <FunctionAnswer id="mx-28" lhs="g(x) =" answer={{ a: 3, b: 11 }} answerTex="3x + 11" placeholder="e.g. 3x + 7" hints={['Up 4 means add $4$ to the output: $g(x) = f(x) + 4$.']} revealed={revealed} />,
  solvedBy: 'mx-28',
  graph: { f: [3, 7], g: [3, 11], v: 'x', view: { x: [0, 5], y: [0, 30] } },
  answer: '$g(x) = 3x + 7 + 4 = 3x + 11$',
  teamwork: false,
})

const mx29 = practiceStep({
  id: 'mx-29',
  part: 'mixed',
  title: 'Mixed #29: write g(x)',
  page: 'P.250',
  num: '29',
  topic: 'Reasoning',
  prompt: 'Write a function $g(x)$ to represent the translated graph: $f(x) = x - 5$ translated 2 units down.',
  q: (revealed) => <FunctionAnswer id="mx-29" lhs="g(x) =" answer={{ a: 1, b: -7 }} answerTex="x - 7" placeholder="e.g. x - 5" hints={['Down 2 means subtract $2$ from the output: $g(x) = f(x) - 2$.']} revealed={revealed} />,
  solvedBy: 'mx-29',
  graph: { f: [1, -5], g: [1, -7], v: 'x', view: { x: [0, 10], y: [-8, 6] } },
  answer: '$g(x) = x - 5 - 2 = x - 7$',
  teamwork: false,
})

export const mx7 = practiceStep({
  id: 'mx-7',
  part: 'translations',
  title: 'Practice #7: bowling',
  page: 'P.247',
  num: '7',
  topic: 'Translations in the Real World',
  context: '**BOWLING** The cost for Nobu to go bowling is \\$4 per game plus an additional flat fee of \\$3.50 for the rental of bowling shoes. The cost can be modeled by the function $f(x) = 4x + 3.5$, where $x$ represents the number of games bowled.',
  image: 'bowling',
  prompt: 'Describe the graph of $g(x)$ as it relates to $f(x)$ if Nobu does not rent bowling shoes.',
  q: (revealed) => {
    const q = translationQ(0, -3.5, 'g(x)', '$f(x)$')
    return (
      <FunctionAnswer
        id="mx-7-fn"
        lhs="g(x) ="
        answer={{ a: 4, b: 0 }}
        answerTex="4x"
        placeholder="e.g. 4x + 3.5"
        hints={['Without shoes, Nobu only pays for the games.']}
        revealed={revealed}
        after={<Sentence id="mx-7" revealed={revealed} parts={q.parts} blanks={q.blanks} />}
      />
    )
  },
  solvedBy: 'mx-7',
  graph: { f: [4, 3.5], g: [4, 0], v: 'x', view: { x: [0, 6], y: [0, 28] }, xLabel: 'games', yLabel: 'cost ($)' },
  answer: '$g(x) = 4x$. The graph of $g(x)$ is the graph of $f(x)$ translated **3.5 units down**.',
})

// ---------------- H.O.T. ----------------

const WODB: { tex: string; color: string; m: number; b: number; why: string }[] = [
  { tex: 'f(x) = 2(x + 1) - 3', color: '#e8496a', m: 2, b: -1, why: 'It is the only one **translated left**: $x + 1$ is grouped with $x$, so $h = -1$.' },
  { tex: 'f(x) = \\frac{1}{2}x - 4', color: '#f08c00', m: 0.5, b: -4, why: 'It is the only one **compressed** ($|a| = \\frac{1}{2} < 1$), so it is the only one less steep than the parent.' },
  { tex: 'f(x) = -3x + 10', color: '#1c9ad6', m: -3, b: 10, why: 'It is the only one **reflected**: its slope is negative, so it falls from left to right.' },
  { tex: 'f(x) = 5(x - 7) + 3', color: '#8f5bd6', m: 5, b: -32, why: 'It is the only one **translated right**: $x - 7$ is grouped with $x$, so $h = 7$.' },
]

function HotBody({ reveal, present }: { reveal: number; present: boolean }) {
  const [open, setOpen] = usePersist<number[]>('hot-wodb', [])
  const isOpen = (i: number) => (present ? reveal > i : open.includes(i))
  const last = present ? reveal - 1 : open[open.length - 1]
  const exprs = useMemo<Expr[]>(
    () => [
      { id: 'f', latex: 'y=x', color: C.parent, dashed: true, width: 2.4 },
      ...WODB.map((w, i) => ({ id: `w${i}`, latex: lineLatex(w.m, w.b), color: w.color, width: i === last ? 5 : 2.6, opacity: last === undefined || last < 0 || i === last ? 1 : 0.35 })),
    ],
    [last],
  )
  return (
    <Split
      present={present}
      left={
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SubTopic>H.O.T. Problems</SubTopic>
            <PagePill page="P.250" />
          </div>
          <p className="text-[1.08rem] font-bold text-ink">
            <span className="mr-2 font-display text-[1.2rem] font-extrabold">36.</span>
            <span className="problem">
              <Md>{'**WHICH ONE DOESN’T BELONG** Consider the four functions. Which one does not belong in this group? Justify your conclusion.'}</Md>
            </span>
          </p>
          <div className={`grid gap-3 ${present ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {WODB.map((w, i) => (
              <button
                key={w.tex}
                type="button"
                onClick={() => setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]))}
                className={`rounded-xl border-[3px] bg-white p-3 text-left ${isOpen(i) ? 'shadow-md' : ''}`}
                style={{ borderColor: w.color }}
                aria-pressed={isOpen(i)}
              >
                <div className="text-center text-[1.08rem]">
                  <Tex>{w.tex}</Tex>
                </div>
                {isOpen(i) && (
                  <div className="mt-2 border-t-2 border-dashed border-line pt-2 text-[0.92rem] font-semibold leading-snug text-ink-2">
                    <Md>{w.why}</Md>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="rounded-xl border-2 border-good/30 bg-good-soft px-3 py-2.5 font-bold text-good">
            <Md>{'Tap each one. **Every** function can be the odd one out. What matters is how you justify it.'}</Md>
          </div>
        </>
      }
      right={
        <div>
          <DesmosGraph exprs={exprs} view={{ x: [-6, 10], y: [-8, 14] }} present={present} className={graphBox(present)} ariaLabel="The four functions" />
          <Legend items={[['f(x) = x', C.parent, true], ...WODB.map((w, i) => [String.fromCharCode(65 + i), w.color] as [string, string])]} />
        </div>
      }
    />
  )
}

const hot: StepDef = {
  id: 'hot',
  part: 'hot',
  title: "H.O.T.: which one doesn't belong",
  page: 'P.250',
  reveals: (m) => (m === 'present' ? WODB.length : 0),
  revealLabel: 'Show next reason',
  render: ({ reveal, present }) => <HotBody reveal={reveal} present={present} />,
}

// ---------------- pause and reflect ----------------

const LEVELS = ['Not yet', 'Getting there', 'Got it']

function ReflectBody({ present }: { present: boolean }) {
  const [note, setNote] = usePersist('reflect-note', '')
  const [conf, setConf] = usePersist<number[]>('reflect-conf', [-1, -1, -1])
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-4">
        <div className="inline-flex flex-col items-center rounded-2xl bg-[#3b8fd0] px-5 py-2 font-display text-[1.3rem] font-extrabold uppercase leading-tight tracking-wider text-[#f6e6c8] shadow-md">
          <span>Pause</span>
          <span className="text-[0.9rem]">and</span>
          <span>Reflect</span>
        </div>
        <div className="space-y-1 font-display text-[1.45rem] font-bold leading-snug text-[#3b8fd0] sm:text-[1.65rem]">
          <p>Did you struggle with anything in this lesson?</p>
          <p>If so, how did you deal with it?</p>
        </div>
        {!present && (
          <>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Write a sentence or two. It stays on this device only."
              className="field w-full resize-y py-2 font-semibold"
            />
            <div className="space-y-2">
              <div className="font-extrabold text-ink">How sure do you feel about each outcome?</div>
              {OUTCOMES.map((o, i) => (
                <div key={o} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-line bg-white p-2.5">
                  <span className="font-bold text-ink-2">{o}</span>
                  <div className="flex gap-1">
                    {LEVELS.map((l, j) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setConf((c) => c.map((x, k) => (k === i ? j : x)))}
                        className={`rounded-lg border-2 px-2.5 py-1 text-[0.85rem] font-extrabold ${conf[i] === j ? ['border-bad bg-bad-soft text-bad', 'border-solution bg-[#fff1e5] text-solution', 'border-good bg-good-soft text-good'][j] : 'border-line text-muted'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <Illus name="reflect" className="mx-auto aspect-square w-full max-w-[18rem]" />
    </div>
  )
}

const reflect: StepDef = { id: 'reflect', part: 'close', title: 'Pause and Reflect', render: ({ present }) => <ReflectBody present={present} /> }

// ---------------- exit ticket ----------------

const EXIT = ['exit-1', 'exit-2', 'exit-3', 'exit-4']

function ExitBody({ reveal, present }: { reveal: number; present: boolean }) {
  const r = reveal >= 1
  const s1 = useSolved('exit-1')
  const s2 = useSolved('exit-2')
  const s3 = useSolved('exit-3')
  const s4 = useSolved('exit-4')
  const score = [s1, s2, s3, s4].filter(Boolean).length
  const q1 = translationQ(0, 7)
  const q2 = translationQ(4, 0)
  const q3 = dilationQ(-3, false)
  const Item = ({ n, fn, children }: { n: number; fn: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border-2 border-line bg-white p-4">
      <div className="mb-1 flex items-center gap-2 text-[1.15rem] font-bold">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-example text-white">{n}</span>
        <Tex>{fn}</Tex>
      </div>
      {children}
    </div>
  )
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Illus name="exit" className="h-16 w-16" />
          <span className="rounded-xl bg-gradient-to-b from-[#ff5a5a] to-[#c81e1e] px-4 py-1.5 font-display text-[1.6rem] font-extrabold text-white shadow-md">Exit Ticket</span>
        </div>
        {!present && (
          <div className="flex items-center gap-1.5 rounded-full border-2 border-line bg-white px-3 py-1 font-extrabold text-ink" aria-label={`${score} out of 4 correct`}>
            {[0, 1, 2, 3].map((i) => (
              <Star key={i} size={20} className={i < score ? 'fill-[#f2a900] text-[#f2a900]' : 'text-line'} />
            ))}
            <span className="ml-1">{score} / 4</span>
          </div>
        )}
      </div>
      <div className={`grid items-center gap-4 ${present ? 'grid-cols-[1fr_auto]' : 'sm:grid-cols-[1fr_auto]'}`}>
        <P>Four quick questions to show what you learned today.</P>
        <Homework />
      </div>
      <div className={`grid gap-3 ${present ? 'grid-cols-2' : 'lg:grid-cols-2'}`}>
        <Item n={1} fn="g(x) = x + 7">
          {describe('exit-1', q1)(r)}
        </Item>
        <Item n={2} fn="g(x) = (x - 4)">
          {describe('exit-2', q2)(r)}
        </Item>
        <Item n={3} fn="g(x) = -3(x)">
          {describe('exit-3', q3)(r)}
        </Item>
        <Item n={4} fn="f(x) = x \text{ translated 5 units down}">
          <FunctionAnswer id="exit-4" lhs="g(x) =" answer={{ a: 1, b: -5 }} answerTex="x - 5" placeholder="e.g. x + 2" revealed={r} />
        </Item>
      </div>
    </div>
  )
}

function Homework() {
  return (
    <div className="flex items-center gap-3">
      <Bubble text="HOMEWORK" className="text-[1.5rem]" />
      <div className="relative rounded-[2.2rem] border-[3px] border-[#e03131] bg-white px-5 py-2 text-center font-display font-extrabold leading-snug text-ink shadow-sm">
        <div>Page: 249</div>
        <div>EX: 22, 23, 24, 25, 26, 27</div>
      </div>
    </div>
  )
}

const exitTicket: StepDef = {
  id: 'exit-ticket',
  part: 'close',
  title: 'Exit Ticket',
  reveals: (m) => (m === 'present' ? 1 : 0),
  revealLabel: 'Show answers',
  render: ({ reveal, present }) => <ExitBody reveal={reveal} present={present} />,
}

// ---------------- class is over ----------------

const over: StepDef = {
  id: 'class-over',
  part: 'close',
  title: 'Class is over',
  render: ({ present, done }) => (
    <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="flex flex-col items-center gap-2">
        <Illus name="bell" className="h-40 w-40 sm:h-48 sm:w-48" />
        <span className="rounded-lg bg-[#efc4b4] px-4 py-1 font-serif text-[1.4rem] uppercase tracking-[0.15em] text-white">Class is over</span>
      </div>
      <div className="space-y-4">
        <div className="rounded-[1.6rem] border-[10px] border-[#6f9b4f] bg-[#fbf4e2] p-6 text-center shadow-[inset_0_0_0_4px_#d8b56a]">
          <div className="font-display text-[1.9rem] font-extrabold leading-tight text-[#3f6b2a]">See you all tomorrow</div>
          <div className="font-display text-[1.5rem] font-bold text-[#3f6b2a]">stay safe</div>
        </div>
        <div className="space-y-2 rounded-2xl border-2 border-line bg-white p-4">
          <div className="flex items-center gap-3">
            <Illus name="trophy" className="h-14 w-14" />
            <div className="font-display text-[1.2rem] font-extrabold">Today you learned to</div>
          </div>
          <ul className="space-y-1.5">
            {OUTCOMES.map((o, i) => {
              const ok = done((['translations', 'dilations', 'reflections'] as const)[i])
              return (
                <li key={o} className="flex items-center gap-2 font-bold text-ink-2">
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${ok ? 'bg-good text-white' : 'border-2 border-line'}`}>{ok && <Check size={14} strokeWidth={4} />}</span>
                  {o}
                </li>
              )
            })}
          </ul>
        </div>
        {!present && <ResetButton label="Start again from the beginning" />}
        <p className="text-[0.85rem] font-bold text-muted">Made by Mohamed Elsayed, Grade 9 &middot; Math teacher: Maysaa Alhaj</p>
      </div>
    </div>
  ),
}

export const wrap: StepDef[] = [journey, takeaways, mx12, mx17, mx21, mx28, mx29, hot, reflect, exitTicket, over]
export const EXIT_IDS = EXIT
