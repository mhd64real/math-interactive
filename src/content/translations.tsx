import { useMemo } from 'react'
import { Md, Tex } from '../components/Tex'
import { Choices, FunctionAnswer, Sentence } from '../components/questions'
import { TransformDemo } from '../components/Plane'
import { ExampleTag, Illus, Remember, SubTopic, ThinkAbout, WatchOut } from '../components/ui'
import type { Expr } from '../components/Desmos'
import { C } from '../lib/desmos'
import { usePersist } from '../lib/store'
import { arrowExprs, spec } from '../lib/transform'
import { conceptStep } from './concept'
import { exampleStep, Legend, ParamSlider, Solution, Split, TagRow, TwoLines, type StepDef } from './kit'
import { AnswerLine } from '../components/questions'
import { describe, practiceStep, translationQ } from './practice'
import { guideStep, herExampleStep, trIntro } from './her'
import { mx7 } from './wrap'

const P = 'translations' as const

// ---------------- vertical ----------------

const conceptV = conceptStep({
  id: 'tr-concept-v',
  part: P,
  title: 'Key Concept: vertical translations',
  page: 'P.239',
  topic: 'Vertical Translations',
  intro: 'A **translation** slides a graph without turning it. When a constant $k$ is added to a linear function $f(x)$, the result is a **vertical translation**: the $y$-intercept of $f(x)$ is translated up or down.',
  cardTitle: 'Vertical Translations of Linear Functions',
  lead: 'The graph of $g(x) = x + k$ is the graph of $f(x) = x$ translated vertically.',
  cases: [
    { head: '**CASE 1:** If $k > 0$, the graph of $f(x)$ is translated $k$ units **up**.', s: spec({ K: 3 }), xs: [-3, -1, 1], foot: 'Every point on the graph of $f(x)$ moves $k$ units up.' },
    { head: '**CASE 2:** If $k < 0$, the graph of $f(x)$ is translated $|k|$ units **down**.', s: spec({ K: -3 }), xs: [-1, 1, 3], foot: 'Every point on the graph of $f(x)$ moves $|k|$ units down.' },
  ],
  after: (
    <div className="grid gap-3 lg:grid-cols-2">
      <Remember>The constant $k$ is **not grouped with $x$**, so it changes the outputs ($y$-values). The move is vertical.</Remember>
      <WatchOut title="Study Tip">When a linear function is translated, the graph moves to a new location, but the **slope stays the same**.</WatchOut>
    </div>
  ),
})

const ex1 = exampleStep({
  id: 'tr-ex1',
  part: P,
  n: 1,
  topic: 'Vertical Translations',
  title: 'Vertical Translations of Linear Functions',
  page: 'P.240',
  problem: 'Describe the translation in $g(x) = x - 2$ as it relates to the graph of the parent function.',
  lines: [
    { tex: 'g(x) = f(x) + k', note: 'General form' },
    { tex: 'g(x) = x - 2 \\;\\rightarrow\\; g(x) = f(x) + (\\vt{-2})', note: '$k = -2$' },
    { text: 'The constant $k$ is **not grouped with $x$**, so $k$ affects the output, or $y$-values.', note: 'vertical' },
    { text: 'The value of $k$ is less than $0$, so the graph of $f(x) = x$ is translated $|-2|$ units down, or $2$ units down.' },
  ],
  answer: '$g(x) = x - 2$ is the translation of the graph of the parent function **2 units down**.',
  table: { head: ['x', 'f(x)', 'f(x) - 2', '(x,\\ g(x))'], rows: [['-2', '-2', '-4', '(-2,\\ -4)'], ['0', '0', '-2', '(0,\\ -2)'], ['1', '1', '-1', '(1,\\ -1)']] },
  spec: spec({ K: -2 }),
  xs: [-2, 0, 1],
  think: {
    text: 'What do you notice about the $y$-intercepts of vertically translated functions compared to the $y$-intercept of the parent function?',
    answer: 'The $y$-intercept moves from $(0, 0)$ to $(0, k)$. Here it moved down to $(0, -2)$.',
  },
})

const check1 = practiceStep({
  id: 'tr-check1',
  part: P,
  title: 'Check: g(x) = x - 1',
  page: 'P.240',
  tag: 'check',
  prompt: 'Describe the translation in $g(x) = x - 1$ as it relates to the graph of the parent function.',
  q: (revealed) => (
    <Sentence
      id="tr-check1"
      revealed={revealed}
      parts={['The graph of $g(x) = x - 1$ is a translation of the graph of the parent function 1 unit ', { b: 'd' }, '.']}
      blanks={{
        d: {
          kind: 'select',
          options: ['up', 'down', 'left', 'right'],
          answer: 'down',
          why: {
            up: 'Look at the sign: $x - 1$ means $k = -1$, and a negative $k$ moves the graph down.',
            left: 'The constant is **not grouped with $x$**, so the move is vertical: up or down.',
            right: 'For $f(x) = x$, right 1 lands on the same line. But $-1$ is **not grouped with $x$**, so describe the vertical move.',
          },
        },
      }}
      hints={['Write it in the general form $g(x) = f(x) + k$. What is $k$?']}
    />
  ),
  solvedBy: 'tr-check1',
  graph: { s: spec({ K: -1 }), xs: [-2, 0, 2] },
  answer: 'The graph of $g(x) = x - 1$ is a translation of the graph of the parent function **1 unit down**.',
})

// ---------------- horizontal ----------------

const conceptH = conceptStep({
  id: 'tr-concept-h',
  part: P,
  title: 'Key Concept: horizontal translations',
  page: 'P.240',
  topic: 'Horizontal Translations',
  intro: 'When a constant $h$ is subtracted from the $x$-value **before** the function $f(x)$ is performed, the result is a **horizontal translation**. The $x$-intercept of $f(x)$ is translated right or left.',
  cardTitle: 'Horizontal Translations of Linear Functions',
  lead: 'The graph of $g(x) = (x - h)$ is the graph of $f(x) = x$ translated horizontally.',
  cases: [
    { head: '**If $h > 0$** (positive $h$): the graph of $f(x)$ is translated $h$ units **right**.', s: spec({ H: 3 }), xs: [-1, 1, 3], foot: 'Every point on the graph of $f(x)$ moves $h$ units right.' },
    { head: '**If $h < 0$** (negative $h$): the graph of $f(x)$ is translated $|h|$ units **left**.', s: spec({ H: -3 }), xs: [-3, -1, 1], foot: 'Every point on the graph of $f(x)$ moves $|h|$ units left.' },
  ],
  after: (
    <div className="grid gap-3 lg:grid-cols-2">
      <Remember>The constant $h$ is **grouped with $x$**, so it changes the inputs ($x$-values). The move is horizontal.</Remember>
      <WatchOut>The sign inside looks backwards. $(x - 3)$ means $h = 3$: **right** 3. $(x + 3)$ means $h = -3$: **left** 3.</WatchOut>
    </div>
  ),
})

const ex2 = exampleStep({
  id: 'tr-ex2',
  part: P,
  n: 2,
  topic: 'Horizontal Translations',
  title: 'Horizontal Translations of Linear Functions',
  page: 'P.241',
  problem: 'Describe the translation in $g(x) = (x + 5)$ as it relates to the graph of the parent function.',
  lines: [
    { tex: 'g(x) = f(x - h)', note: 'General form' },
    { tex: 'g(x) = (x + 5) \\;\\rightarrow\\; g(x) = f(x - (\\hz{-5}))', note: '$h = -5$' },
    { text: 'The constant $h$ is **grouped with $x$**, so $h$ affects the input, or $x$-values.', note: 'horizontal' },
    { text: 'The value of $h$ is less than $0$, so the graph of $f(x) = x$ is translated $|-5|$ units left, or $5$ units left.' },
  ],
  answer: '$g(x) = (x + 5)$ is the translation of the graph of the parent function **5 units left**.',
  table: { head: ['x', 'x + 5', 'f(x + 5)', '(x,\\ g(x))'], rows: [['-2', '3', '3', '(-2,\\ 3)'], ['0', '5', '5', '(0,\\ 5)'], ['1', '6', '6', '(1,\\ 6)']] },
  spec: spec({ H: -5 }),
  xs: [-2, 0, 1],
  think: {
    text: 'What do you notice about the $x$-intercepts of horizontally translated functions compared to the $x$-intercept of the parent function?',
    answer: 'The $x$-intercept moves from $(0, 0)$ to $(h, 0)$. Here it moved left to $(-5, 0)$.',
  },
})

const check2 = practiceStep({
  id: 'tr-check2',
  part: P,
  title: 'Check: g(x) = (x + 12)',
  page: 'P.241',
  tag: 'check',
  prompt: 'Describe the translation in $g(x) = (x + 12)$ as it relates to the graph of the parent function.',
  q: (revealed) => (
    <Sentence
      id="tr-check2"
      revealed={revealed}
      parts={['The graph of $g(x) = (x + 12)$ is a translation of the graph of the parent function 12 units ', { b: 'd' }, '.']}
      blanks={{
        d: {
          kind: 'select',
          options: ['up', 'down', 'left', 'right'],
          answer: 'left',
          why: {
            right: 'Watch Out! $(x + 12)$ means $h = -12$. A negative $h$ moves the graph **left**.',
            up: 'For $f(x) = x$, up 12 lands on the same line. But $+12$ is **grouped with $x$**, so describe the horizontal move.',
            down: 'The constant is **grouped with $x$**, so the move is left or right.',
          },
        },
      }}
      hints={['Write it as $f(x - h)$. What is $h$?']}
    />
  ),
  solvedBy: 'tr-check2',
  graph: { s: spec({ H: -12 }), xs: [-12, -9] },
  answer: 'The graph of $g(x) = (x + 12)$ is a translation of the graph of the parent function **12 units left**.',
})

// ---------------- both ----------------

const ex3 = exampleStep({
  id: 'tr-ex3',
  part: P,
  n: 3,
  topic: 'Multiple Translations',
  title: 'Multiple Translations of Linear Functions',
  page: 'P.241',
  problem: 'Describe the translation in $g(x) = (x - 6) + 3$ as it relates to the graph of the parent function.',
  lines: [
    { tex: 'g(x) = f(x - h) + k', note: 'General form' },
    { tex: 'g(x) = (x - \\hz{6}) + \\vt{3}', note: '$h = 6$ and $k = 3$' },
    { text: 'The value of $h$ is **grouped with $x$** and greater than $0$, so the graph of $f(x) = x$ is translated **6 units right**.', note: 'horizontal' },
    { text: 'The value of $k$ is **not grouped with $x$** and greater than $0$, so the graph is translated **3 units up**.', note: 'vertical' },
  ],
  answer: '$g(x) = (x - 6) + 3$ is the translation of the graph of the parent function **6 units right and 3 units up**.',
  table: { head: ['x', 'x - 6', 'f(x - 6) + 3', '(x,\\ g(x))'], rows: [['-2', '-8', '-5', '(-2,\\ -5)'], ['0', '-6', '-3', '(0,\\ -3)'], ['1', '-5', '-2', '(1,\\ -2)']] },
  spec: spec({ H: 6, K: 3 }),
  xs: [-2, 0, 1],
})

const eleni: StepDef = {
  id: 'tr-eleni',
  part: P,
  title: 'Think About It: Eleni',
  page: 'P.241',
  reveals: (m) => (m === 'present' ? 1 : 0),
  revealLabel: 'Show answer',
  render: ({ reveal, present }) => (
    <Split
      present={present}
      left={
        <>
          <SubTopic>Multiple Translations</SubTopic>
          <ThinkAbout>
            <Md>{'Eleni described the graph of $g(x) = (x - 6) + 3$ as the graph of the parent function translated **down 3 units**. Is she correct? Explain your reasoning.'}</Md>
          </ThinkAbout>
          <Choices
            id="tr-eleni"
            revealed={reveal >= 1}
            options={[
              {
                text: 'Yes, she is correct.',
                correct: true,
                why: 'Simplify: $(x - 6) + 3 = x - 3$, which is the parent function translated **3 units down**. For $f(x) = x$, "right 6 and up 3" and "down 3" land on the very same line. The equation as written shows the steps: right 6, then up 3.',
              },
              { text: 'No, she is not correct.', why: 'Try simplifying $(x - 6) + 3$ first. What do you get? Then compare the two paths on the graphs.' },
            ]}
          />
          <WatchOut>This only works because the parent is $f(x) = x$. Two different journeys can end on the same line. You will see more of this later.</WatchOut>
        </>
      }
      right={
        <div className="grid grid-cols-2 gap-3">
          <figure className="rounded-2xl border-2 border-line bg-white p-2">
            <TransformDemo s={spec({ H: 6, K: 3 })} xs={[0, 2]} x={[-7, 4]} y={[-7, 4]} />
            <figcaption className="pt-1 text-center text-[0.9rem] font-extrabold text-ink-2">
              <Tex>{'(x - 6) + 3'}</Tex>: right 6, up 3
            </figcaption>
          </figure>
          <figure className="rounded-2xl border-2 border-line bg-white p-2">
            <TransformDemo s={spec({ K: -3 })} xs={[0, 2]} x={[-7, 4]} y={[-7, 4]} />
            <figcaption className="pt-1 text-center text-[0.9rem] font-extrabold text-ink-2">
              <Tex>{'x - 3'}</Tex>: down 3
            </figcaption>
          </figure>
          <div className="col-span-2">
            <Legend />
          </div>
        </div>
      }
    />
  ),
}

// ---------------- real world ----------------

function TicketsBody({ reveal, present }: { reveal: number; present: boolean }) {
  const [t, setT] = usePersist('ex4-t', 2)
  const lines = [
    { tex: 'g(t) = f(t) + k', note: 'General form' },
    { tex: 'g(t) = 12t + 4 \\;\\rightarrow\\; g(t) = f(t) + \\vt{4}', note: '$k = 4$' },
    { text: 'The constant $k$ is added **after** the total price of the tickets has been evaluated, so it is **not grouped with $t$**.', note: 'vertical' },
    { text: 'The value of $k$ is greater than $0$, so the graph is shifted **4 units up**.' },
  ]
  const extra = useMemo<Expr[]>(
    () => [
      { id: 'pf', latex: `\\left(${t},${12 * t}\\right)`, color: C.parent, pointSize: 10, label: `f(${t}) = ${12 * t}`, labelPos: 'LEFT' },
      { id: 'pg', latex: `\\left(${t},${12 * t + 4}\\right)`, color: C.g, pointSize: 11, label: `g(${t}) = ${12 * t + 4}`, labelPos: 'LEFT' },
      ...arrowExprs('fee', { x: t, y: 12 * t }, { x: t, y: 12 * t + 4 }, C.vert, { x: 0.22, y: 2.6 }),
    ],
    [t],
  )
  return (
    <Split
      present={present}
      left={
        <>
          <SubTopic>Translations in the Real World</SubTopic>
          <TagRow page="P.242">
            <ExampleTag n={4} />
            <span className="rounded-full border-2 border-line px-2 text-[0.75rem] font-extrabold uppercase tracking-wide text-muted">Textbook</span>
            <span className="font-display text-[1.15rem] font-extrabold text-ink">Translations of Linear Functions</span>
          </TagRow>
          <div className="flex items-start gap-3">
            <Illus name="tickets" className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />
            <p className="text-[1.04rem] leading-relaxed text-ink">
              <Md>{'**TICKETS** A website sells tickets to concerts and sporting events. The total price of the tickets to a certain game can be modeled by $f(t) = 12t$, where $t$ represents the number of tickets purchased. The website then charges a standard service fee of \\$4 per order, so the total price of an order can be modeled by $g(t) = 12t + 4$.'}</Md>
            </p>
          </div>
          <p className="text-[1.08rem] font-bold text-ink">
            <span className="problem">
              <Md>{'Describe the translation of $g(t)$ as it relates to $f(t)$.'}</Md>
            </span>
          </p>
          <Solution lines={lines} shown={Math.min(reveal, lines.length)} />
          {reveal > lines.length && <AnswerLine>{'$g(t) = 12t + 4$ is the translation of the graph of $f(t)$ **4 units up**.'}</AnswerLine>}
        </>
      }
      right={
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border-2 border-line bg-white">
            <div className="flex items-center justify-between bg-[#24324a] px-4 py-2 text-white">
              <span className="font-display text-[1.05rem] font-extrabold tracking-wide">GAME TICKETS</span>
              <span className="text-[0.8rem] font-bold opacity-80">Checkout</span>
            </div>
            <div className="space-y-2 p-4 text-[1rem] font-bold">
              <ParamSlider name="t" value={t} min={1} max={6} step={1} onChange={setT} color="g" />
              <div className="flex justify-between text-ink-2"><span>Ticket price</span><span>$12.00 &times; {t}</span></div>
              <div className="flex justify-between text-ink-2"><span>Subtotal</span><span className="text-parent">${(12 * t).toFixed(2)}</span></div>
              <div className="flex justify-between text-vert"><span>Service fee</span><span>+ $4.00</span></div>
              <div className="flex justify-between border-t-2 border-dashed border-line pt-2 text-[1.15rem] text-g"><span>TOTAL</span><span>${(12 * t + 4).toFixed(2)}</span></div>
            </div>
          </div>
          <TwoLines f={[12, 0]} g={[12, 4]} v="t" view={{ x: [0, 6.5], y: [0, 85] }} present={present} extra={extra} xLabel="tickets" yLabel="total price ($)" box="h-[18rem]" />
        </div>
      }
    />
  )
}

const ex4: StepDef = {
  id: 'tr-ex4',
  part: P,
  title: 'Textbook Example 4: tickets',
  page: 'P.242',
  reveals: 5,
  render: ({ reveal, present }) => <TicketsBody reveal={reveal} present={present} />,
}

const check4 = practiceStep({
  id: 'tr-check4',
  part: P,
  title: 'Check: Jerome buys paint',
  page: 'P.242',
  tag: 'check',
  context: '**RETAIL** Jerome is buying paint for a mural. The total cost of the paint can be modeled by the function $f(p) = 6.99p$. He has a coupon for \\$5.95 off his purchase at the art supply store, so the final cost of his purchase can be modeled by $g(p) = 6.99p - 5.95$.',
  image: 'paint',
  prompt: 'Describe the translation in $g(p)$ as it relates to $f(p)$.',
  q: (revealed) => {
    const q = translationQ(0, -5.95, 'g(p)', '$f(p)$')
    return <Sentence id="tr-check4" revealed={revealed} parts={q.parts} blanks={q.blanks} hints={['The coupon is subtracted **after** the cost is worked out. Is it grouped with $p$?']} />
  },
  solvedBy: 'tr-check4',
  graph: { f: [6.99, 0], g: [6.99, -5.95], v: 'p', view: { x: [0, 5.5], y: [-8, 36] }, xLabel: 'cans of paint', yLabel: 'cost ($)' },
  answer: 'The graph of $g(p) = 6.99p - 5.95$ is the graph of $f(p) = 6.99p$ translated **5.95 units down**.',
})

// ---------------- practice P.247 ----------------

const PR = (n: number, fn: string, h: number, k: number, xs: number[], hints: string[] = []) => {
  const q = translationQ(h, k)
  const dirs = [h !== 0 ? `${Math.abs(h)} units ${h > 0 ? 'right' : 'left'}` : '', k !== 0 ? `${Math.abs(k)} units ${k > 0 ? 'up' : 'down'}` : ''].filter(Boolean).join(' and ')
  return practiceStep({
    id: `tr-p${n}`,
    part: P,
    title: `Practice #${n}: g(x) = ${fn.replace(/\\/g, '')}`,
    page: 'P.247',
    num: String(n),
    prompt: `Describe the translation in $g(x) = ${fn}$ as it relates to the graph of the parent function.`,
    q: describe(`tr-p${n}`, q, hints.length ? hints : ['Write it as $g(x) = f(x - h) + k$. Which constants are grouped with $x$?']),
    solvedBy: `tr-p${n}`,
    graph: { s: spec({ H: h, K: k }), xs },
    answer: `The graph of $g(x) = ${fn}$ is the graph of the parent function translated **${dirs}**.`,
    her: { move: { kind: 'tr', h, k }, fn },
  })
}

const INSTR = 'Describe the translation in each function as it relates to the graph of the parent function.'
const h1 = herExampleStep({ id: 'tr-h1', part: P, num: 1, page: 'P.247', instruction: INSTR, fn: 'x + 11', move: { kind: 'tr', h: 0, k: 11 }, xs: [-6, -2] })
const p2 = PR(2, 'x - 8', 0, -8, [2, 6])
const h3 = herExampleStep({ id: 'tr-h3', part: P, num: 3, page: 'P.247', topic: 'Horizontal Translations', instruction: INSTR, fn: '(x - 7)', move: { kind: 'tr', h: 7, k: 0 }, xs: [2, 5] })
const h5 = herExampleStep({ id: 'tr-h5', part: P, num: 5, page: 'P.247', topic: 'Multiple Translations', instruction: INSTR, fn: '(x + 10) - 1', move: { kind: 'tr', h: -10, k: -1 }, xs: [-8, -5] })
const p6 = PR(6, '(x - 9) + 5', 9, 5, [2, 5])

const p8 = practiceStep({
  id: 'tr-p8',
  part: P,
  title: 'Practice #8: savings',
  page: 'P.247',
  num: '8',
  topic: 'Translations in the Real World',
  context: '**SAVINGS** Natalie has \\$250 in her savings account, into which she deposits \\$10 of her allowance each week. The balance of her savings account can be modeled by the function $f(w) = 250 + 10w$, where $w$ represents the number of weeks.',
  image: 'savings',
  prompt: 'Write a function $g(w)$ to represent the balance of her savings account if she withdraws \\$40 to purchase a new pair of shoes. Describe the translation of $f(w)$ that results in $g(w)$.',
  q: (revealed) => {
    const q = translationQ(0, -40, 'g(w)', '$f(w)$')
    return (
      <FunctionAnswer
        id="tr-p8-fn"
        v="w"
        lhs="g(w) ="
        answer={{ a: 10, b: 210 }}
        answerTex="210 + 10w"
        placeholder="e.g. 250 + 10w"
        hints={['Start from $f(w) = 250 + 10w$ and take away the \\$40.']}
        revealed={revealed}
        after={<Sentence id="tr-p8" revealed={revealed} parts={q.parts} blanks={q.blanks} hints={['The \\$40 is taken away from the whole balance. Is it grouped with $w$?']} />}
      />
    )
  },
  solvedBy: 'tr-p8',
  graph: { f: [10, 250], g: [10, 210], v: 'w', view: { x: [0, 12], y: [150, 400] }, xLabel: 'weeks', yLabel: 'balance ($)' },
  answer: '$g(w) = 210 + 10w$. The graph of $g(w)$ is the graph of $f(w)$ translated **40 units down**.',
})

const p9 = practiceStep({
  id: 'tr-p9',
  part: P,
  title: 'Practice #9: boat rental',
  page: 'P.247',
  num: '9',
  topic: 'Translations in the Real World',
  context: '**BOAT RENTAL** The cost to rent a paddle boat at the county park is \\$8 per hour plus a nonrefundable deposit of \\$10. The cost can be modeled by the function $f(h) = 8h + 10$, where $h$ represents the number of hours the boat is rented.',
  image: 'boat',
  prompt: 'Describe the graph of $g(h)$ as it relates to $f(h)$ if the nonrefundable deposit increases to \\$15.',
  q: (revealed) => {
    const q = translationQ(0, 5, 'g(h)', '$f(h)$')
    return (
      <FunctionAnswer
        id="tr-p9-fn"
        v="h"
        lhs="g(h) ="
        answer={{ a: 8, b: 15 }}
        answerTex="8h + 15"
        placeholder="e.g. 8h + 10"
        hints={['Only the deposit changes: \\$10 becomes \\$15.']}
        revealed={revealed}
        after={<Sentence id="tr-p9" revealed={revealed} parts={q.parts} blanks={q.blanks} hints={['The deposit is added after the hours are paid for. Is it grouped with $h$? How much bigger is it?']} />}
      />
    )
  },
  solvedBy: 'tr-p9',
  graph: { f: [8, 10], g: [8, 15], v: 'h', view: { x: [0, 6], y: [0, 70] }, xLabel: 'hours', yLabel: 'cost ($)', names: ['f', 'g'] },
  answer: '$g(h) = 8h + 15$. The graph of $g(h)$ is the graph of $f(h)$ translated **5 units up**.',
})

export const translations: StepDef[] = [trIntro(P), conceptV, h1, p2, check1, ex1, conceptH, h3, check2, ex2, guideStep(P), h5, p6, ex3, eleni, ex4, check4, mx7, p8, p9]
