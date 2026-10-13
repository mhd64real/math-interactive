import { FunctionAnswer, Sentence } from '../components/questions'
import { Remember, WatchOut } from '../components/ui'
import { spec } from '../lib/transform'
import { conceptStep } from './concept'
import { exampleStep, type StepDef } from './kit'
import { describe, dilationQ, practiceStep } from './practice'
import { diIntro, fnPlain, herExampleStep } from './her'

const P = 'dilations' as const

const conceptV = conceptStep({
  id: 'di-concept-v',
  part: P,
  title: 'Key Concept: vertical dilations',
  page: 'P.243',
  topic: 'Vertical Dilations',
  intro: 'A **dilation** stretches or compresses the graph of a function. When a linear function $f(x)$ is multiplied by a positive constant $a$, the result $a \\cdot f(x)$ is a **vertical dilation**.',
  cardTitle: 'Vertical Dilations of Linear Functions',
  lead: 'The graph of $g(x) = ax$ is the graph of $f(x) = x$ stretched or compressed vertically.',
  cases: [
    { head: 'If $|a| > 1$, the graph of $f(x)$ is **stretched vertically** away from the $x$-axis.', s: spec({ A: 2 }), xs: [-2, 1, 2], foot: 'The slope of the graph of $a \\cdot f(x)$ is **steeper** than that of the graph of $f(x)$.' },
    { head: 'If $0 < |a| < 1$, the graph of $f(x)$ is **compressed vertically** toward the $x$-axis.', s: spec({ A: 0.5 }), xs: [-4, 2, 4], foot: 'The slope of the graph of $a \\cdot f(x)$ is **less steep** than that of the graph of $f(x)$.' },
  ],
  after: <Remember>Vertical dilation: $a$ is **not grouped with $x$**, so every $y$-value is multiplied by $a$. Each point moves straight up or down, away from or toward the $x$-axis.</Remember>,
})

const ex5 = exampleStep({
  id: 'di-ex5',
  part: P,
  n: 5,
  topic: 'Vertical Dilations',
  title: 'Vertical Dilations of Linear Functions',
  page: 'P.244',
  problem: 'Describe the dilation in $g(x) = 2(x)$ as it relates to the graph of the parent function.',
  lines: [
    { tex: 'g(x) = a \\cdot f(x)', note: 'General form' },
    { tex: 'g(x) = 2(x) \\;\\rightarrow\\; g(x) = \\vt{2}\\,f(x)', note: '$a = 2$' },
    { text: 'The positive constant $a$ is **not grouped with $x$**, so it affects the output, or $y$-values.', note: 'vertical' },
    { text: '$|a|$ is greater than $1$, so the graph of $f(x) = x$ is **stretched vertically** by a factor of $a$, or $2$.' },
  ],
  answer: '$g(x) = 2(x)$ is a **vertical stretch** of the graph of the parent function. The slope of the graph of $g(x)$ is **steeper** than that of $f(x)$.',
  table: { head: ['x', 'f(x)', '2f(x)', '(x,\\ g(x))'], rows: [['-2', '-2', '-4', '(-2,\\ -4)'], ['0', '0', '0', '(0,\\ 0)'], ['1', '1', '2', '(1,\\ 2)']] },
  spec: spec({ A: 2 }),
  xs: [-2, 0, 1],
  think: {
    text: 'What do you notice about the slope of the vertical dilation $g(x)$ compared to the slope of $f(x)$? How does this relate to the constant $a$?',
    answer: 'The slope of $g(x)$ is $2$, exactly the constant $a$. The parent has slope $1$, so $g(x)$ is steeper.',
  },
})

const check5 = practiceStep({
  id: 'di-check5',
  part: P,
  title: 'Check: g(x) = 6(x)',
  page: 'P.244',
  tag: 'check',
  prompt: 'Describe the transformation in $g(x) = 6(x)$ as it relates to the graph of the parent function.',
  q: (revealed) => (
    <Sentence
      id="di-check5"
      revealed={revealed}
      parts={['The graph of $g(x) = 6(x)$ is a ', { b: 't' }, ' of the graph of the parent function. The slope of the graph $g(x)$ is ', { b: 's' }, ' than that of the parent function.']}
      blanks={{
        t: {
          kind: 'select',
          options: ['vertical stretch', 'vertical compression', 'horizontal stretch', 'horizontal compression'],
          answer: 'vertical stretch',
          why: {
            'vertical compression': '$|a| = 6$ is greater than $1$, and that stretches.',
            'horizontal stretch': 'The $6$ multiplies $f(x)$, it is **not grouped with $x$**, so the dilation is vertical.',
            'horizontal compression': 'For $f(x) = x$ this lands on the same line! But the $6$ is **not grouped with $x$**, so describe the vertical dilation.',
          },
        },
        s: { kind: 'select', options: ['steeper', 'less steep'], answer: 'steeper', why: { 'less steep': 'Every $y$-value is multiplied by $6$, so the line rises much faster.' } },
      }}
      hints={['Is the $6$ grouped with $x$? Is $|a|$ bigger or smaller than $1$?']}
    />
  ),
  solvedBy: 'di-check5',
  graph: { s: spec({ A: 6 }), xs: [-0.5, 0.5] },
  answer: 'The graph of $g(x) = 6(x)$ is a **vertical stretch** of the graph of the parent function. Its slope is **steeper**.',
})

const conceptH = conceptStep({
  id: 'di-concept-h',
  part: P,
  title: 'Key Concept: horizontal dilations',
  page: 'P.243',
  topic: 'Horizontal Dilations',
  intro: 'When $x$ is multiplied by a positive constant $a$ **before** a linear function $f(a \\cdot x)$ is evaluated, the result is a **horizontal dilation**.',
  cardTitle: 'Horizontal Dilations of Linear Functions',
  lead: 'The graph of $g(x) = (a \\cdot x)$ is the graph of $f(x) = x$ stretched or compressed horizontally.',
  cases: [
    { head: 'If $|a| > 1$, the graph of $f(x)$ is **compressed horizontally** toward the $y$-axis.', s: spec({ B: 2 }), xs: [-1.5, 1, 2], foot: 'The slope of the graph of $f(a \\cdot x)$ is **steeper** than that of the graph of $f(x)$.' },
    { head: 'If $0 < |a| < 1$, the graph of $f(x)$ is **stretched horizontally** away from the $y$-axis.', s: spec({ B: 0.5 }), xs: [-4, 2, 4], foot: 'The slope of the graph of $f(a \\cdot x)$ is **less steep** than that of the graph of $f(x)$.' },
  ],
  after: (
    <div className="grid gap-3 lg:grid-cols-2">
      <WatchOut>Inside does the opposite of what you expect. A **big** $a$ inside **squeezes** the graph toward the $y$-axis. A **small** $a$ inside **stretches** it away.</WatchOut>
      <Remember>Horizontal dilation: $a$ is **grouped with $x$**, so every point moves straight left or right, toward or away from the $y$-axis.</Remember>
    </div>
  ),
})

const ex6 = exampleStep({
  id: 'di-ex6',
  part: P,
  n: 6,
  topic: 'Horizontal Dilations',
  title: 'Horizontal Dilations of Linear Functions',
  page: 'P.244',
  problem: 'Describe the dilation in $g(x) = \\left(\\frac{1}{4}x\\right)$ as it relates to the graph of the parent function.',
  lines: [
    { tex: 'g(x) = f(a \\cdot x)', note: 'General form' },
    { tex: 'g(x) = \\left(\\tfrac{1}{4}x\\right) \\;\\rightarrow\\; g(x) = f\\left(\\hz{\\tfrac{1}{4}}\\,x\\right)', note: '$a = \\frac{1}{4}$' },
    { text: 'The positive constant $a$ is **grouped with $x$**, so it affects the input, or $x$-values.', note: 'horizontal' },
    { text: '$|a|$ is between $0$ and $1$, so the graph of $f(x) = x$ is **stretched horizontally** by a factor of $\\frac{1}{a}$, or $4$.' },
  ],
  answer: '$g(x) = \\left(\\frac{1}{4}x\\right)$ is a **horizontal stretch** of the graph of the parent function. The slope of the graph of $g(x)$ is **less steep** than that of $f(x)$.',
  table: { head: ['x', '\\frac{1}{4}x', 'f\\left(\\frac{1}{4}x\\right)', '(x,\\ g(x))'], rows: [['-4', '-1', '-1', '(-4,\\ -1)'], ['0', '0', '0', '(0,\\ 0)'], ['4', '1', '1', '(4,\\ 1)']] },
  spec: spec({ B: 0.25 }),
  xs: [-4, 0, 4],
  think: {
    text: 'What do you notice about the slope of the horizontal dilation $g(x)$ compared to the slope of $f(x)$? How does this relate to the constant $a$?',
    answer: 'The slope of $g(x)$ is $\\frac{1}{4}$, which is $a$ again. It is less steep than the parent, whose slope is $1$.',
  },
})

const D = (n: number, fn: string, a: number, inside: boolean, xs: number[], factor: string) => {
  const q = dilationQ(a, inside)
  const big = Math.abs(a) > 1
  const word = inside ? (big ? 'compressed horizontally' : 'stretched horizontally') : big ? 'stretched vertically' : 'compressed vertically'
  return practiceStep({
    id: `di-p${n}`,
    part: P,
    title: `Practice #${n}: g(x) = ${fnPlain(fn)}`,
    page: 'P.248',
    num: String(n),
    prompt: `Describe the dilation in $g(x) = ${fn}$ as it relates to the graph of the parent function.`,
    q: describe(`di-p${n}`, q, ['Is $a$ grouped with $x$? Then compare $|a|$ with $1$.'], `The factor is ${factor}.`),
    solvedBy: `di-p${n}`,
    graph: { s: inside ? spec({ B: a }) : spec({ A: a }), xs },
    answer: `The graph of $g(x) = ${fn}$ is the graph of the parent function **${word}**.`,
    her: { move: inside ? { kind: 'hd', a } : { kind: 'vd', a }, fn },
  })
}

const p11 = D(11, '\\frac{1}{3}(x)', 1 / 3, false, [-3, 3], '$\\frac{1}{3}$: every $y$-value is multiplied by $\\frac{1}{3}$')
const p14 = D(14, '\\left(\\frac{3}{4}x\\right)', 0.75, true, [-4, 4], '$\\frac{4}{3}$: every point gets farther from the $y$-axis')
const p15 = D(15, '(0.4x)', 0.4, true, [-5, 5], '$\\frac{1}{0.4} = 2.5$: every point gets 2.5 times farther from the $y$-axis')

const INSTR = 'Describe the dilation in each function as it relates to the graph of the parent function.'
const h10 = herExampleStep({ id: 'di-h10', part: P, num: 10, page: 'P.248', instruction: INSTR, fn: '5(x)', move: { kind: 'vd', a: 5 }, xs: [-0.8, 0.8] })
const h13 = herExampleStep({ id: 'di-h13', part: P, num: 13, page: 'P.248', topic: 'Horizontal Dilations', instruction: INSTR, fn: '(3x)', move: { kind: 'hd', a: 3 }, xs: [-1, 1] })

const p31 = practiceStep({
  id: 'di-p31',
  part: P,
  title: 'Practice #31: phone games',
  page: 'P.250',
  num: '31',
  topic: 'Dilations in the Real World',
  context: '**GAMES** The function $f(x) = 0.50x$ gives the average cost in dollars for $x$ cell phone game downloads that cost an average of \\$0.50 each.',
  image: 'phone-game',
  prompt: 'Write a function $g(x)$ to represent the cost in dollars for $x$ cell phone game downloads that cost \\$1.50 each. Describe the graph of $g(x)$ compared to $f(x)$.',
  q: (revealed) => (
    <FunctionAnswer
      id="di-p31-fn"
      lhs="g(x) ="
      answer={{ a: 1.5, b: 0 }}
      answerTex="1.50x"
      placeholder="e.g. 0.50x"
      hints={['Each download now costs \\$1.50 instead of \\$0.50.']}
      revealed={revealed}
      after={
        <Sentence
          id="di-p31"
          revealed={revealed}
          parts={['$1.50x = 3(0.50x) = 3f(x)$, so the graph of $g(x)$ is the graph of $f(x)$ ', { b: 'sc' }, ' ', { b: 'dir' }, ' by a factor of ', { b: 'n' }, '.']}
          blanks={{
            sc: { kind: 'select', options: ['stretched', 'compressed'], answer: 'stretched', why: { compressed: 'Each game costs more, so the cost line rises faster: that is a stretch.' } },
            dir: { kind: 'select', options: ['vertically', 'horizontally'], answer: 'vertically', why: { horizontally: 'The $3$ multiplies the whole output $f(x)$, it is not grouped with $x$.' } },
            n: { kind: 'number', answer: 3 },
          }}
        />
      }
    />
  ),
  solvedBy: 'di-p31',
  graph: { f: [0.5, 0], g: [1.5, 0], v: 'x', view: { x: [0, 10], y: [0, 16] }, xLabel: 'downloads', yLabel: 'cost ($)' },
  answer: '$g(x) = 1.50x$. The graph of $g(x)$ is the graph of $f(x)$ **stretched vertically by a factor of 3**, so it is steeper.',
})

export const dilations: StepDef[] = [diIntro(P), conceptV, h10, p11, check5, ex5, conceptH, h13, p14, ex6, p15, p31]
