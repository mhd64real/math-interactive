import { useMemo, useState } from 'react'
import { ArrowRight, Check, NotebookPen, Presentation, RotateCcw, TabletSmartphone } from 'lucide-react'
import DesmosGraph, { type Expr } from '../components/Desmos'
import { Md, Tex } from '../components/Tex'
import { Choices, Sentence } from '../components/questions'
import { FLine, Dot, Label, Plane, TransformDemo } from '../components/Plane'
import { H2, Illus, P, Problem, Remember, VocabTitle, WarmUpTitle } from '../components/ui'
import { C } from '../lib/desmos'
import { usePersist } from '../lib/store'
import { parseNumber } from '../lib/linear'
import { arrowExprs, spec, tex } from '../lib/transform'
import ResetButton from '../components/ResetButton'
import { graphBox, Legend, OUTCOMES, ParamSlider, Split, type StepDef } from './kit'

// ---------------- cover ----------------

const cover: StepDef = {
  id: 'start',
  part: 'start',
  title: 'Get ready',
  render: ({ present, next, switchMode }) => (
    <div className={`grid items-center gap-6 ${present ? 'grid-cols-[1.1fr_1fr] gap-10' : 'lg:grid-cols-[1.1fr_1fr] lg:gap-10'}`}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border-2 border-tab-ink/25 bg-tab px-2 font-display text-[0.95rem] font-extrabold leading-7 text-tab-ink">Lesson 4-4</span>
          <span className="text-[0.85rem] font-extrabold text-date">Module 4: Linear and Nonlinear Functions</span>
        </div>
        <h1 className="font-display text-[2.35rem] font-extrabold leading-[1.05] text-ink sm:text-[3rem]">Transformations of Linear Functions</h1>
        <p className="text-[1.15rem] font-semibold leading-relaxed text-ink-2">
          Slide it. Stretch it. Flip it. Find out how changing an equation moves its graph, with Desmos built into every step.
        </p>
        <div className="rounded-2xl border-2 border-outcome-edge bg-outcome/60 p-4">
          <div className="font-extrabold text-outcome-ink">Make sure you have everything you need with you</div>
          <ul className="mt-2.5 grid gap-2 text-[0.95rem] font-bold text-ink-2 sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <TabletSmartphone size={20} className="shrink-0 text-outcome-edge" /> Your device
            </li>
            <li className="flex items-center gap-2">
              <NotebookPen size={20} className="shrink-0 text-outcome-edge" /> Notebook and pencil
            </li>
          </ul>
        </div>
        {!present && (
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary min-h-12 px-6 text-[1.05rem]" onClick={next}>
              Start the lesson <ArrowRight size={20} />
            </button>
            <button type="button" className="btn btn-ghost min-h-12" onClick={() => switchMode('present')}>
              <Presentation size={20} /> Present mode
            </button>
          </div>
        )}
 <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-[0.85rem] font-bold text-muted">Made by Mohamed Elsayed, Grade 9 &middot; Math teacher: Maysaa Alhaj</p>
          {!present && <ResetButton />}
        </div>
      </div>
      <Illus name="ready-kit" className="mx-auto aspect-square w-full max-w-[24rem]" />
    </div>
  ),
}

// ---------------- warm up ----------------

const warm1: StepDef = {
  id: 'warmup-1',
  part: 'warmup',
  title: 'Warm Up: slope and y-intercept',
  page: 'P.229',
  reveals: (m) => (m === 'present' ? 1 : 0),
  revealLabel: 'Show answers',
  render: ({ reveal }) => (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <WarmUpTitle />
          <P>Yesterday you learned slope-intercept form. Let's use it to get ready.</P>
        </div>
        <Illus name="warmup" className="h-28 w-28 shrink-0 sm:h-36 sm:w-36" />
      </div>
      <Problem>Identify the slope $m$ and the $y$-intercept $b$ of each line.</Problem>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-line p-4">
          <div className="mb-1 text-[1.2rem] font-bold">
            <span className="mr-2 inline-grid h-8 w-8 place-items-center rounded-full bg-l4 text-white">1</span>
            <Tex>{'y = 3x - 4'}</Tex>
          </div>
          <Sentence
            id="wu1a"
            revealed={reveal >= 1}
            parts={['$m =$', { b: 'm' }, ' and $b =$', { b: 'b' }]}
            blanks={{
              m: { kind: 'number', answer: 3 },
              b: { kind: 'number', answer: -4, why: (v) => (v === 4 ? 'Watch the sign: $y = 3x - 4$ means $b = -4$.' : undefined) },
            }}
            hints={['Compare with $y = mx + b$: the number in front of $x$ is $m$, the constant is $b$.']}
          />
        </div>
        <div className="rounded-2xl border-2 border-line p-4">
          <div className="mb-1 text-[1.2rem] font-bold">
            <span className="mr-2 inline-grid h-8 w-8 place-items-center rounded-full bg-l1 text-white">2</span>
            <Tex>{'y = -\\frac{1}{2}x + 5'}</Tex>
          </div>
          <Sentence
            id="wu1b"
            revealed={reveal >= 1}
            parts={['$m =$', { b: 'm' }, ' and $b =$', { b: 'b' }]}
            blanks={{
              m: { kind: 'number', answer: -0.5, why: (v) => (v === 0.5 ? 'Almost. The slope keeps its negative sign: $m = -\\frac{1}{2}$.' : undefined) },
              b: { kind: 'number', answer: 5 },
            }}
            hints={['Fractions are fine: type -1/2 or -0.5.']}
          />
        </div>
      </div>
      <Remember>In $y = mx + b$, $m$ is the **slope** and $b$ is the **y-intercept**.</Remember>
    </div>
  ),
}

const TABLE_X = [-3, -1, 0, 2]

function IdentityTable({ revealed, present }: { revealed: boolean; present: boolean }) {
  const [vals, setVals] = usePersist<Record<number, string>>('wu2', {})
  const right = (x: number) => revealed || parseNumber(vals[x] ?? '') === x
  const all = TABLE_X.every(right)
  const exprs = useMemo<Expr[]>(() => {
    const out: Expr[] = TABLE_X.filter(right).map((x) => ({ id: `p${x}`, latex: `\\left(${x},${x}\\right)`, color: C.parent, pointSize: 11, label: `(${x}, ${x})`, labelPos: 'RIGHT' as const }))
    if (all) out.unshift({ id: 'line', latex: 'y=x', color: C.parent, width: 3.5 })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vals, revealed])
  return (
    <Split
      present={present}
      left={
        <>
          <Problem>Complete the table for $f(x) = x$. Each correct point appears on the graph.</Problem>
          <table className="w-full max-w-sm border-collapse overflow-hidden rounded-xl text-center text-[1.1rem] shadow-[0_0_0_2px_#2e6bc6]">
            <thead>
              <tr className="bg-[#2e6bc6] text-white">
                <th className="px-3 py-2 [&_.katex]:text-white"><Tex>x</Tex></th>
                <th className="px-3 py-2 [&_.katex]:text-white"><Tex>{'f(x) = x'}</Tex></th>
              </tr>
            </thead>
            <tbody>
              {TABLE_X.map((x) => (
                <tr key={x} className="border-t border-[#b9cfee]">
                  <td className="px-3 py-1.5 font-bold"><Tex>{String(x)}</Tex></td>
                  <td className="px-3 py-1.5">
                    <input
                      className={`field w-20 text-center ${right(x) ? 'is-good' : vals[x] ? 'is-bad' : ''}`}
                      inputMode="decimal"
                      value={revealed ? String(x) : (vals[x] ?? '')}
                      disabled={revealed || right(x)}
                      placeholder="?"
                      onChange={(e) => setVals((v) => ({ ...v, [x]: e.target.value }))}
                      aria-label={`f of ${x}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {all ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 rounded-xl border-2 border-good/30 bg-good-soft px-3 py-2.5 font-bold text-good">
                <Check size={20} strokeWidth={3} className="mt-0.5 shrink-0" />
                <span>Every output equals its input. This simple line is the star of today's lesson.</span>
              </div>
              <Remember>Every equation of the form $y = ax$ represents a line that passes through the **origin**.</Remember>
            </div>
          ) : (
            <P>Hint: for $f(x) = x$, whatever goes in comes straight back out.</P>
          )}
        </>
      }
      right={<DesmosGraph exprs={exprs} view={{ x: [-5, 5], y: [-5, 5] }} present={present} className={graphBox(present)} ariaLabel="Points of f(x) = x" />}
    />
  )
}

const warm2: StepDef = {
  id: 'warmup-2',
  part: 'warmup',
  title: 'Warm Up: the line y = x',
  reveals: (m) => (m === 'present' ? 1 : 0),
  revealLabel: 'Show answers',
  render: ({ reveal, present }) => (
    <div className="space-y-4">
      <WarmUpTitle />
      <IdentityTable revealed={reveal >= 1} present={present} />
    </div>
  ),
}

// ---------------- vocabulary ----------------

const VOCAB: { word: string; def: string; icon?: string; visual: React.ReactNode }[] = [
  {
    word: 'family of graphs',
    def: 'Graphs and equations of graphs that have at least one characteristic in common.',
    visual: (
      <Plane x={[-4, 4]} y={[-4, 4]} axisLabels={false}>
        {[-2, -1, 1, 2].map((b) => (
          <FLine key={b} m={1} b={b} color={C.g} width={2.6} opacity={0.75} />
        ))}
        <FLine m={1} b={0} color={C.parent} width={3.4} />
      </Plane>
    ),
  },
  {
    word: 'parent function',
    def: 'The simplest of the functions in a family.',
    visual: (
      <Plane x={[-4, 4]} y={[-4, 4]} axisLabels={false}>
        <FLine m={2} b={1} color={C.muted} width={2} opacity={0.5} />
        <FLine m={0.5} b={-1} color={C.muted} width={2} opacity={0.5} />
        <FLine m={-1} b={2} color={C.muted} width={2} opacity={0.5} />
        <FLine m={1} b={0} color={C.parent} width={4} />
        <Label p={{ x: 1.6, y: 2.6 }} size={15}>f(x) = x</Label>
      </Plane>
    ),
  },
  {
    word: 'identity function',
    def: '$f(x) = x$, the parent function of linear functions. Every output equals its input.',
    visual: (
      <Plane x={[-4, 4]} y={[-4, 4]} axisLabels={false}>
        <FLine m={1} b={0} color={C.parent} width={3.4} />
        {[-2, 1, 3].map((v) => (
          <g key={v}>
            <Dot p={{ x: v, y: v }} color={C.horiz} r={5} />
            <Label p={{ x: v, y: v }} color={C.horiz} dx={8} dy={14} size={13}>{`(${v}, ${v})`.replace('-', '−')}</Label>
          </g>
        ))}
      </Plane>
    ),
  },
  {
    word: 'transformation',
    def: 'Moves the graph on the coordinate plane, which can create new linear functions.',
    visual: <TransformDemo s={spec({ H: 2, K: 1 })} xs={[-2, 0, 2]} x={[-4, 4]} y={[-4, 4]} />,
  },
  {
    word: 'translation',
    def: 'Slides a figure from one position to another without turning it: up, down, left or right.',
    icon: 'translation',
    visual: <TransformDemo s={spec({ K: 2 })} xs={[-2, 0, 1.5]} x={[-4, 4]} y={[-4, 4]} />,
  },
  {
    word: 'dilation',
    def: 'Stretches or compresses the graph of a function.',
    icon: 'dilation',
    visual: <TransformDemo s={spec({ A: 2 })} xs={[-1.5, 1, 1.8]} x={[-4, 4]} y={[-4, 4]} />,
  },
  {
    word: 'reflection',
    def: 'Flips a figure, line or curve across a line, like a mirror.',
    icon: 'reflection',
    visual: <TransformDemo s={spec({ A: -1 })} xs={[-2, 1, 2.5]} x={[-4, 4]} y={[-4, 4]} />,
  },
]

function FlipCard({ word, def, icon, visual, flipped, onFlip }: (typeof VOCAB)[number] & { flipped: boolean; onFlip: () => void }) {
  return (
    <button type="button" onClick={onFlip} className="group relative h-[17.5rem] w-full text-left [perspective:1200px]" aria-pressed={flipped} aria-label={`${word}: ${flipped ? 'show the word' : 'show the meaning'}`}>
      <span className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-line bg-white p-4 [backface-visibility:hidden]">
          {icon && <Illus name={icon} className="h-20 w-20" />}
          <span className="rounded-xl border-[3px] border-example bg-white px-4 py-2 text-center font-display text-[1.45rem] font-extrabold italic leading-tight text-example shadow-sm">{word}</span>
          <span className="text-[0.8rem] font-bold text-muted">Tap to see what it means</span>
        </span>
        <span className="absolute inset-0 flex flex-col gap-2 overflow-hidden rounded-2xl border-2 border-primary/30 bg-white p-3 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="font-display text-[1.1rem] font-extrabold italic text-example">{word}</span>
          <span className="text-[0.95rem] font-semibold leading-snug text-ink-2">
            <Md>{def}</Md>
          </span>
          <span className="mx-auto mt-auto block w-[9.5rem]">{visual}</span>
        </span>
      </span>
    </button>
  )
}

function VocabCards({ reveal, present }: { reveal: number; present: boolean }) {
  const [flips, setFlips] = useState<boolean[]>(() => VOCAB.map(() => false))
  const isFlipped = (i: number) => (present ? reveal > i : flips[i])
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <VocabTitle />
        <div className="flex items-center gap-3">
          {!present && (
            <button type="button" className="btn btn-soft" onClick={() => setFlips((f) => (f.every(Boolean) ? VOCAB.map(() => false) : VOCAB.map(() => true)))}>
              <RotateCcw size={18} /> {flips.every(Boolean) ? 'Flip all back' : 'Flip all'}
            </button>
          )}
          <Illus name="vocab" className="h-20 w-20 sm:h-24 sm:w-24" />
        </div>
      </div>
      <div className={`grid gap-3 ${present ? 'grid-cols-4' : 'grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4'}`}>
        {VOCAB.map((v, i) => (
          <FlipCard key={v.word} {...v} flipped={isFlipped(i)} onFlip={() => setFlips((f) => f.map((x, j) => (j === i ? !x : x)))} />
        ))}
      </div>
    </div>
  )
}

const vocab: StepDef = {
  id: 'vocab',
  part: 'vocab',
  title: 'New Vocabulary',
  page: 'P.239',
  reveals: (m) => (m === 'present' ? VOCAB.length : 0),
  revealLabel: 'Flip next card',
  render: ({ reveal, present }) => <VocabCards reveal={reveal} present={present} />,
}

// ---------------- learning outcomes ----------------

const outcomes: StepDef = {
  id: 'outcomes',
  part: 'outcomes',
  title: 'Learning Outcomes',
  render: ({ done }) => (
    <div className="grid items-center gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-4">
        <div className="inline-block rounded-xl border-[3px] border-primary bg-white px-4 py-2 font-display text-[1.45rem] font-extrabold leading-tight text-primary sm:text-[1.7rem]">4-4 Transformations of Linear Functions</div>
        <div>
          <span className="inline-block rounded-xl border-[3px] border-primary/70 px-3 py-1 font-display text-[1.15rem] font-extrabold text-primary">Learning Outcomes</span>
        </div>
        <ol className="space-y-3">
          {OUTCOMES.map((o, i) => {
            const ok = done((['translations', 'dilations', 'reflections'] as const)[i])
            return (
              <li key={o} className="flex items-center gap-3 rounded-xl border-[3px] border-primary/70 bg-white p-2.5 pr-4">
                <Illus name={['translation', 'dilation', 'reflection'][i]} className="h-12 w-12 shrink-0" />
                <span className="flex-1 text-[1.08rem] font-extrabold text-primary">
                  {i + 1}. {o}
                </span>
                {ok && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-good text-white" title="Done">
                    <Check size={18} strokeWidth={3.5} />
                  </span>
                )}
              </li>
            )
          })}
        </ol>
        <P>By the end, you will look at an equation like $g(x) = (x - 6) + 3$ and say exactly how its graph moved.</P>
      </div>
      <div className="mx-auto w-full max-w-[22rem] rounded-2xl border-2 border-line bg-white p-3">
        <TransformDemo s={spec({ H: 2, K: 1 })} xs={[-2, 0, 2]} />
        <Legend />
      </div>
    </div>
  ),
}

// ---------------- explore ----------------

const inquiry: StepDef = {
  id: 'inquiry',
  part: 'explore',
  title: 'Inquiry',
  page: 'P.239',
  render: ({ present }) => (
    <Split
      present={present}
      left={
        <>
          <div className="rounded-3xl border-2 border-inquiry-edge bg-inquiry p-5">
            <span className="inline-flex rounded-full bg-practice px-3 font-display text-[0.95rem] font-extrabold uppercase leading-7 tracking-wide text-white">Inquiry</span>
            <h2 className="mt-3 font-display text-[1.6rem] font-extrabold leading-tight text-ink sm:text-[1.9rem]">How does performing an operation on a linear function change its graph?</h2>
          </div>
          <P>Your mission: run three quick experiments on the parent function $f(x) = x$. Watch what moves, and what stays the same.</P>
          <ol className="space-y-2.5">
            {[
              ['1', 'Add a number', 'g(x) = x + k', 'bg-vert'],
              ['2', 'Change the input', 'g(x) = (x - h)', 'bg-horiz'],
              ['3', 'Multiply', 'g(x) = a \\cdot x', 'bg-g'],
            ].map(([n, t, f, bg]) => (
              <li key={n} className="flex items-center gap-3 rounded-xl border-2 border-line bg-white p-2.5">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-lg font-extrabold text-white ${bg}`}>{n}</span>
                <span className="font-extrabold text-ink">{t}</span>
                <span className="ml-auto text-[1.05rem]"><Tex>{f}</Tex></span>
              </li>
            ))}
          </ol>
        </>
      }
      right={<Illus name="inquiry" className="mx-auto aspect-square w-full max-w-[20rem]" />}
    />
  ),
}

function Task({ ok, children }: { ok: boolean; children: string }) {
  return (
    <li className={`flex items-center gap-2.5 font-bold ${ok ? 'text-good' : 'text-ink-2'}`}>
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${ok ? 'border-good bg-good text-white' : 'border-line bg-white'}`}>{ok && <Check size={14} strokeWidth={4} />}</span>
      <Md>{children}</Md>
    </li>
  )
}

function ExploreK({ present }: { present: boolean }) {
  const [k, setK] = usePersist('ex-k', 0)
  const [seen, setSeen] = usePersist<{ pos: boolean; neg: boolean }>('ex-k-seen', { pos: false, neg: false })
  const onK = (v: number) => {
    setK(v)
    if (v > 0 && !seen.pos) setSeen({ ...seen, pos: true })
    if (v < 0 && !seen.neg) setSeen({ ...seen, neg: true })
  }
  const exprs = useMemo<Expr[]>(() => {
    const out: Expr[] = [
      { id: 'f', latex: 'y=x', color: C.parent, dashed: true, width: 2.6 },
      { id: 'g', latex: `y=x${k === 0 ? '' : k > 0 ? `+${k}` : k}`, color: C.g, width: 4 },
      { id: 'yi', latex: `\\left(0,${k}\\right)`, color: C.g, pointSize: 12, label: `y-intercept (0, ${k})`, labelPos: 'RIGHT' },
    ]
    ;[-3, 3].forEach((x) => out.push(...arrowExprs(`a${x}`, { x, y: x }, { x, y: x + k }, C.vert, 0.4)))
    return out
  }, [k])
  const kTex = k === 0 ? '' : k > 0 ? `\\vt{+\\,${k}}` : `\\vt{-\\,${-k}}`
  return (
    <Split
      present={present}
      graphFirst
      left={
        <>
          <H2>Experiment 1: Add a number</H2>
          <P>Here is $g(x) = x + k$. Drag the slider and watch the green line.</P>
          <div className="rounded-2xl bg-canvas px-4 py-3 text-center text-[1.6rem]">
            <Tex>{`g(x) = x ${kTex}`}</Tex>
          </div>
          <ParamSlider name="k" value={k} min={-6} max={6} step={1} onChange={onK} color="v" />
          <ul className="space-y-1.5">
            <Task ok={seen.pos}>Make $k$ positive</Task>
            <Task ok={seen.neg}>Make $k$ negative</Task>
          </ul>
          <div className="space-y-2">
            <div className="font-extrabold text-ink"><Md>{'What does adding $k$ do to the graph?'}</Md></div>
            <Choices
              id="ex-k-q"
              options={[
                { text: 'It slides the line up or down.', correct: true, why: 'Every point moves $k$ units up (or down). The y-intercept moves from $(0, 0)$ to $(0, k)$, and the slope stays $1$: the lines are parallel.' },
                { text: 'It makes the line steeper.', why: 'Look at the slope: the green line stays parallel to the dashed one, so the steepness does not change.' },
                { text: 'It flips the line.', why: 'Nothing flips here. Try $k = -4$ and compare with the dashed line.' },
              ]}
            />
          </div>
        </>
      }
      right={
        <div>
          <DesmosGraph exprs={exprs} view={{ x: [-7, 7], y: [-7, 7] }} present={present} className={graphBox(present)} ariaLabel="g(x) = x + k" />
          <Legend items={[['f(x) = x', C.parent, true], ['g(x) = x + k', C.g], ['every point moves k', C.vert]]} />
        </div>
      }
    />
  )
}

function ExploreH({ present }: { present: boolean }) {
  const [h, setH] = usePersist('ex-h', 0)
  const [seen, setSeen] = usePersist<{ three: boolean; minus: boolean }>('ex-h-seen', { three: false, minus: false })
  const onH = (v: number) => {
    setH(v)
    if (v === 3 && !seen.three) setSeen({ ...seen, three: true })
    if (v === -3 && !seen.minus) setSeen({ ...seen, minus: true })
  }
  const exprs = useMemo<Expr[]>(() => {
    const out: Expr[] = [
      { id: 'f', latex: 'y=x', color: C.parent, dashed: true, width: 2.6 },
      { id: 'g', latex: `y=x${h === 0 ? '' : h > 0 ? `-${h}` : `+${-h}`}`, color: C.g, width: 4 },
      { id: 'xi', latex: `\\left(${h},0\\right)`, color: C.g, pointSize: 12, label: `x-intercept (${h}, 0)`, labelPos: 'BELOW_RIGHT' },
    ]
    ;[-3, 3].forEach((y) => out.push(...arrowExprs(`a${y}`, { x: y, y }, { x: y + h, y }, C.horiz, 0.4)))
    return out
  }, [h])
  const hTex = h === 0 ? 'x' : h > 0 ? `x \\hz{-\\,${h}}` : `x \\hz{+\\,${-h}}`
  return (
    <Split
      present={present}
      graphFirst
      left={
        <>
          <H2>Experiment 2: Change the input</H2>
          <P>Now the number goes **inside**, grouped with $x$: $g(x) = (x - h)$. Watch the $x$-intercept.</P>
          <div className="rounded-2xl bg-canvas px-4 py-3 text-center text-[1.6rem]">
            <Tex>{`g(x) = (${hTex})`}</Tex>
          </div>
          <ParamSlider name="h" value={h} min={-6} max={6} step={1} onChange={onH} color="h" />
          <ul className="space-y-1.5">
            <Task ok={seen.three}>Make $h = 3$. Which way did the line go?</Task>
            <Task ok={seen.minus}>Make $h = -3$. Now the equation shows $x + 3$.</Task>
          </ul>
          <div className="space-y-2">
            <div className="font-extrabold text-ink">
              <Md>{'$g(x) = (x - 3)$ moved the line...'}</Md>
            </div>
            <Choices
              id="ex-h-q"
              options={[
                { text: '3 units left', why: 'Look again at $h = 3$: the x-intercept went to $(3, 0)$. That is the other way.' },
                { text: '3 units right', correct: true, why: '$(x - 3)$ means $h = 3$, so the graph moves 3 units **right**. Inside, the sign does the opposite of what it looks like.' },
                { text: '3 units up', why: 'The number is inside, grouped with $x$, so the move is sideways.' },
              ]}
            />
          </div>
        </>
      }
      right={
        <div>
          <DesmosGraph exprs={exprs} view={{ x: [-7, 7], y: [-7, 7] }} present={present} className={graphBox(present)} ariaLabel="g(x) = (x - h)" />
          <Legend items={[['f(x) = x', C.parent, true], ['g(x) = (x − h)', C.g], ['every point moves h', C.horiz]]} />
        </div>
      }
    />
  )
}

function ExploreA({ present }: { present: boolean }) {
  const [a, setA] = usePersist('ex-a', 1)
  const [seen, setSeen] = usePersist<{ steep: boolean; flat: boolean; neg: boolean }>('ex-a-seen', { steep: false, flat: false, neg: false })
  const onA = (v: number) => {
    setA(v)
    const s = { ...seen }
    if (v > 1) s.steep = true
    if (v > 0 && v < 1) s.flat = true
    if (v < 0) s.neg = true
    if (s.steep !== seen.steep || s.flat !== seen.flat || s.neg !== seen.neg) setSeen(s)
  }
  const exprs = useMemo<Expr[]>(() => {
    const out: Expr[] = [
      { id: 'f', latex: 'y=x', color: C.parent, dashed: true, width: 2.6 },
      { id: 'g', latex: `y=${tex(a)}x`, color: C.g, width: 4 },
    ]
    ;[-2, 2].forEach((x) => out.push(...arrowExprs(`a${x}`, { x, y: x }, { x, y: a * x }, C.vert, 0.4)))
    return out
  }, [a])
  return (
    <Split
      present={present}
      graphFirst
      left={
        <>
          <H2>Experiment 3: Multiply</H2>
          <P>Now multiply by a number: $g(x) = a \cdot x$. Try big, small and negative values of $a$.</P>
          <div className="rounded-2xl bg-canvas px-4 py-3 text-center text-[1.6rem]">
            <Tex>{`g(x) = \\vt{${tex(a)}}\\,x`}</Tex>
          </div>
          <ParamSlider name="a" value={a} min={-4} max={4} step={0.25} onChange={onA} color="v" format={(v) => tex(v)} />
          {a === 0 && <P>{'With $a = 0$ every point lands on the $x$-axis, so the line is flat. Today we keep $a \\neq 0$.'}</P>}
          <ul className="space-y-1.5">
            <Task ok={seen.steep}>{'Make the line steeper ($a > 1$)'}</Task>
            <Task ok={seen.flat}>{'Make it less steep ($0 < a < 1$)'}</Task>
            <Task ok={seen.neg}>Make $a$ negative</Task>
          </ul>
          <div className="space-y-2">
            <div className="font-extrabold text-ink"><Md>{'What happens when $a$ is negative?'}</Md></div>
            <Choices
              id="ex-a-q"
              options={[
                { text: 'The line flips across an axis.', correct: true, why: 'A negative $a$ reflects the line. Multiplying by $-1$ sends every point $(x, y)$ to $(x, -y)$, across the $x$-axis.' },
                { text: 'The line moves up.', why: 'Multiplying does not slide the line: it still passes through the origin.' },
                { text: 'Nothing changes.', why: 'Compare $a = 2$ with $a = -2$: the line points the other way.' },
              ]}
            />
          </div>
        </>
      }
      right={
        <div>
          <DesmosGraph exprs={exprs} view={{ x: [-6, 6], y: [-6, 6] }} present={present} className={graphBox(present)} ariaLabel="g(x) = a times x" />
          <Legend items={[['f(x) = x', C.parent, true], ['g(x) = a x', C.g], ['every point moves', C.vert]]} />
        </div>
      }
    />
  )
}

const exploreK: StepDef = { id: 'explore-k', part: 'explore', title: 'Experiment 1: add a number', page: 'P.239', render: ({ present }) => <ExploreK present={present} /> }
const exploreH: StepDef = { id: 'explore-h', part: 'explore', title: 'Experiment 2: change the input', page: 'P.239', render: ({ present }) => <ExploreH present={present} /> }
const exploreA: StepDef = { id: 'explore-a', part: 'explore', title: 'Experiment 3: multiply', page: 'P.239', render: ({ present }) => <ExploreA present={present} /> }

export const intro: StepDef[] = [cover, warm1, warm2, vocab, outcomes, inquiry, exploreK, exploreH, exploreA]
