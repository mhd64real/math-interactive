import { useMemo } from 'react'
import { Choices, Sentence } from '../components/questions'
import DesmosGraph, { type Expr } from '../components/Desmos'
import { Md } from '../components/Tex'
import { PagePill, Remember, SubTopic } from '../components/ui'
import { C } from '../lib/desmos'
import { usePersist } from '../lib/store'
import { lineLatex, spec, tex } from '../lib/transform'
import { conceptStep } from './concept'
import { exampleStep, graphBox, Legend, ParamSlider, Split, type StepDef } from './kit'
import { describe, dilationQ, practiceStep } from './practice'
import { fnPlain, herExampleStep, reIntro } from './her'

const P = 'reflections' as const

const concept = conceptStep({
  id: 're-concept',
  part: P,
  title: 'Key Concept: reflections',
  page: 'P.245',
  topic: 'Reflections',
  intro: 'A **reflection** is a transformation in which a figure, line or curve is flipped across a line. When a linear function $f(x)$ is multiplied by $-1$ before or after the function has been evaluated, the result is a reflection across the $x$- or $y$-axis. Every $x$- or $y$-coordinate of $f(x)$ is multiplied by $-1$.',
  cardTitle: 'Reflections of Linear Functions',
  lead: 'Watch which coordinate changes its sign.',
  cases: [
    { head: 'The graph of $-f(x)$ is the reflection of the graph of $f(x) = x$ across the **$x$-axis**.', s: spec({ A: -1 }), xs: [-3, 1, 3], foot: 'Every $y$-coordinate of $-f(x)$ is the matching $y$-coordinate of $f(x)$ multiplied by $-1$.' },
    { head: 'The graph of $f(-x)$ is the reflection of the graph of $f(x) = x$ across the **$y$-axis**.', s: spec({ B: -1 }), xs: [-3, 1, 3], foot: 'Every $x$-coordinate of $f(-x)$ is the matching $x$-coordinate of $f(x)$ multiplied by $-1$.' },
  ],
  after: <Remember>Negative **outside** (not grouped with $x$): flip across the $x$-axis. Negative **inside** (grouped with $x$): flip across the $y$-axis.</Remember>,
})

const ex7 = exampleStep({
  id: 're-ex7',
  part: P,
  n: 7,
  topic: 'Reflections Across the x-Axis',
  title: 'Reflections of Linear Functions Across the x-Axis',
  page: 'P.245',
  problem: 'Describe the transformation in $g(x) = -\\frac{1}{2}(x)$ as it relates to the graph of the parent function.',
  lines: [
    { tex: 'g(x) = -1 \\cdot a \\cdot f(x)', note: 'General form' },
    { tex: 'g(x) = -\\tfrac{1}{2}(x) \\;\\rightarrow\\; g(x) = \\vt{-}\\,\\vt{\\tfrac{1}{2}}\\,f(x)', note: '$a = \\frac{1}{2}$' },
    { text: 'The constant $a$ is **not grouped with $x$**, and $|a|$ is less than $1$, so the graph of $f(x) = x$ is **vertically compressed**.', note: 'vertical' },
    { text: 'The negative is **not grouped with $x$**, so the graph is also **reflected across the $x$-axis**.', note: 'across the $x$-axis' },
  ],
  answer: 'The graph of $g(x) = -\\frac{1}{2}(x)$ is the graph of the parent function **vertically compressed and reflected across the $x$-axis**.',
  table: { head: ['x', 'f(x)', '-\\frac{1}{2}f(x)', '(x,\\ g(x))'], rows: [['-2', '-2', '1', '(-2,\\ 1)'], ['0', '0', '0', '(0,\\ 0)'], ['4', '4', '-2', '(4,\\ -2)']] },
  spec: spec({ A: -0.5 }),
  xs: [-2, 0, 4],
})

function TalkBody({ reveal, present }: { reveal: number; present: boolean }) {
  const [m, setM] = usePersist('re-talk-m', -2)
  const exprs = useMemo<Expr[]>(
    () => [
      { id: 'f', latex: lineLatex(m, 1), color: C.parent, dashed: true, width: 3 },
      { id: 'g', latex: lineLatex(-m, -1), color: C.g, width: 4 },
    ],
    [m],
  )
  return (
    <Split
      present={present}
      graphFirst
      left={
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SubTopic>Reflections Across the x-Axis</SubTopic>
            <PagePill page="P.245" />
          </div>
          <div className="rounded-2xl border-2 border-think-edge bg-think-soft p-4">
            <div className="font-display text-[1.15rem] font-extrabold text-think-ink">Talk About It!</div>
            <p className="mt-1 leading-relaxed text-ink">
              <Md>{'In Example 7, the slope of $g(x)$ is negative. Will this **always** be the case when multiplying a linear function by $-1$? Justify your argument.'}</Md>
            </p>
          </div>
          <p className="text-[1.02rem] text-ink-2">
            <Md>{'Test it: choose the slope of $f(x) = mx + 1$, and Desmos draws $-f(x)$ in green.'}</Md>
          </p>
          <ParamSlider name="m" value={m} min={-3} max={3} step={0.5} onChange={setM} color="g" format={(v) => tex(v)} />
          <div className="rounded-xl bg-canvas px-3 py-2 text-center text-[1.15rem]">
            <Md>{`$f(x) = ${lineLatex(m, 1).slice(2)}$ and $-f(x) = ${lineLatex(-m, -1).slice(2)}$`}</Md>
          </div>
          <Choices
            id="re-talk"
            revealed={reveal >= 1}
            options={[
              { text: 'Yes, the slope of $-f(x)$ is always negative.', why: 'Use the slider: make the slope of $f(x)$ negative. What is the slope of $-f(x)$ then?' },
              { text: 'No, not always.', correct: true, why: 'Multiplying by $-1$ **changes the sign** of the slope. If $f(x)$ already has a negative slope, $-f(x)$ has a positive slope. For example, $f(x) = -2x$ gives $-f(x) = 2x$.' },
            ]}
          />
        </>
      }
      right={
        <div>
          <DesmosGraph exprs={exprs} view={{ x: [-5, 5], y: [-5, 5] }} present={present} className={graphBox(present)} ariaLabel="f(x) and its reflection" />
          <Legend items={[['f(x) = mx + 1', C.parent, true], ['−f(x)', C.g]]} />
        </div>
      }
    />
  )
}

const talk: StepDef = {
  id: 're-talk',
  part: P,
  title: 'Talk About It: is the slope always negative?',
  page: 'P.245',
  reveals: (m) => (m === 'present' ? 1 : 0),
  revealLabel: 'Show answer',
  render: ({ reveal, present }) => <TalkBody reveal={reveal} present={present} />,
}

const check7 = practiceStep({
  id: 're-check7',
  part: P,
  title: 'Check: which axis?',
  page: 'P.246',
  tag: 'check',
  prompt: 'How can you tell whether multiplying $-1$ by the parent function will result in a reflection across the $x$-axis?',
  q: (revealed) => (
    <Choices
      id="re-check7"
      revealed={revealed}
      options={[
        { text: 'If the constant is **not grouped with $x$**, the result will be a reflection across the $x$-axis.', correct: true, why: 'Not grouped with $x$ means the outputs ($y$-values) are multiplied by $-1$, so the graph flips across the $x$-axis.' },
        { text: 'If the constant is **grouped with $x$**, the result will be a reflection across the $x$-axis.', why: 'Grouped with $x$ means the inputs change sign. That flips the graph across the **$y$-axis**.' },
        { text: 'If the constant is greater than $0$, the result will be a reflection across the $x$-axis.', why: 'A positive constant never flips the graph.' },
        { text: 'If the constant is less than $0$, the result will be a reflection across the $x$-axis.', why: 'A negative constant does flip the graph, but it could be across either axis. What decides which one?' },
      ]}
    />
  ),
  solvedBy: 're-check7',
  graph: { s: spec({ A: -1 }), xs: [-2, 2] },
  answer: '**A.** If the constant is not grouped with $x$, the result is a reflection across the $x$-axis.',
})

const ex8 = exampleStep({
  id: 're-ex8',
  part: P,
  n: 8,
  topic: 'Reflections Across the y-Axis',
  title: 'Reflections of Linear Functions Across the y-Axis',
  page: 'P.246',
  problem: 'Describe the transformation in $g(x) = (-3x)$ as it relates to the graph of the parent function.',
  lines: [
    { tex: 'g(x) = f(-1 \\cdot a \\cdot x)', note: 'General form' },
    { tex: 'g(x) = (-3x) \\;\\rightarrow\\; g(x) = f(\\hz{-}\\,\\hz{3}\\,x)', note: '$a = 3$' },
    { text: 'The constant $a$ is **grouped with $x$**, and $|a|$ is greater than $1$, so the graph of $f(x) = x$ is **horizontally compressed**.', note: 'horizontal' },
    { text: 'The negative is **grouped with $x$**, so the graph is also **reflected across the $y$-axis**.', note: 'across the $y$-axis' },
  ],
  answer: 'The graph of $g(x) = (-3x)$ is the graph of the parent function **horizontally compressed and reflected across the $y$-axis**.',
  table: { head: ['x', '-3x', 'f(-3x)', '(x,\\ g(x))'], rows: [['-1', '3', '3', '(-1,\\ 3)'], ['0', '0', '0', '(0,\\ 0)'], ['1', '-3', '-3', '(1,\\ -3)']] },
  spec: spec({ B: -3 }),
  xs: [-1, 0, 1],
})

const check8 = practiceStep({
  id: 're-check8',
  part: P,
  title: 'Check: g(x) = (-10x)',
  page: 'P.246',
  tag: 'check',
  prompt: 'Describe the reflection in $g(x) = (-10x)$ as it relates to the graph of the parent function.',
  q: (revealed) => (
    <Sentence
      id="re-check8"
      revealed={revealed}
      parts={['The graph of $g(x) = (-10x)$ is the graph of the parent function compressed horizontally and reflected across the ', { b: 'ax' }, '.']}
      blanks={{ ax: { kind: 'select', options: ['x-axis', 'y-axis'], answer: 'y-axis', why: { 'x-axis': 'The negative is **grouped with $x$**, so every $x$-coordinate changes sign: across the $y$-axis.' } } }}
    />
  ),
  solvedBy: 're-check8',
  graph: { s: spec({ B: -10 }), xs: [-0.4, 0.4] },
  answer: 'The graph of $g(x) = (-10x)$ is compressed horizontally and reflected across the **$y$-axis**.',
})

const R = (n: number, page: string, fn: string, a: number, inside: boolean, xs: number[], topic: string) => {
  const big = Math.abs(a) > 1
  const word = `${inside ? (big ? 'compressed horizontally' : 'stretched horizontally') : big ? 'stretched vertically' : 'compressed vertically'} and reflected across the $${inside ? 'y' : 'x'}$-axis`
  return practiceStep({
    id: `re-p${n}`,
    part: P,
    title: `Practice #${n}: g(x) = ${fnPlain(fn)}`,
    page,
    num: String(n),
    topic,
    prompt: `Describe the transformation in $g(x) = ${fn}$ as it relates to the graph of the parent function.`,
    q: describe(`re-p${n}`, dilationQ(a, inside), ['First: is the constant grouped with $x$? Then: is $|a|$ bigger or smaller than $1$? Last: where is the negative?']),
    solvedBy: `re-p${n}`,
    graph: { s: inside ? spec({ B: a }) : spec({ A: a }), xs },
    answer: `The graph of $g(x) = ${fn}$ is the graph of the parent function **${word}**.`,
    her: { move: inside ? { kind: 'ry', a: -a } : { kind: 'rx', a: -a }, fn },
  })
}

const p18 = R(18, 'P.248', '-\\frac{2}{3}(x)', -2 / 3, false, [-3, 3], '')
const p19 = R(19, 'P.249', '\\left(-\\frac{4}{5}x\\right)', -4 / 5, true, [-4, 4], '')

const h16 = herExampleStep({ id: 're-h16', part: P, num: 16, page: 'P.248', topic: 'Reflections of Linear Functions Across the x-Axis', instruction: 'Describe how the graph of each function is related to the graph of the parent function.', fn: '-4(x)', move: { kind: 'rx', a: 4 }, xs: [-1, 1] })
const h20 = herExampleStep({ id: 're-h20', part: P, num: 20, page: 'P.249', topic: 'Reflections of Linear Functions Across the y-Axis', instruction: 'Describe the transformation in each function as it relates to the graph of the parent function.', fn: '(-6x)', move: { kind: 'ry', a: 6 }, xs: [-0.5, 0.5] })

export const reflections: StepDef[] = [reIntro(P), concept, h16, p18, check7, ex7, talk, h20, p19, check8, ex8]
