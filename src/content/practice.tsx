import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Md, Tex } from '../components/Tex'
import { AnswerLine, Sentence, type Blank, type Part } from '../components/questions'
import { CheckTag, Illus, PracticeTag, SolutionTag, SubTopic, TeamWork } from '../components/ui'
import { usePersist } from '../lib/store'
import { plain, type Spec } from '../lib/transform'
import { ConvinceGraph, Split, TagRow, TwoLines, type PartId, type StepDef } from './kit'
import type { View } from '../components/Desmos'
import { herSolution, SolLines, type Move } from './her'

export const useSolved = (id: string) => usePersist<boolean>(`solved:${id}`, false)[0]

// ---------------- sentence builders for "describe the transformation" ----------------

const DIRS = ['up', 'down', 'left', 'right']

const amountWhy = (amt: number) => (v: number) =>
  Math.abs(v + amt) < 1e-9 ? 'Use the distance, which is positive. The direction word tells up, down, left or right.' : undefined

/** Translation by h (inside) and/or k (outside). */
export function translationQ(h: number, k: number, gname = 'g(x)', parent = 'the parent function'): { parts: Part[]; blanks: Record<string, Blank> } {
  const hDir = h > 0 ? 'right' : 'left'
  const kDir = k > 0 ? 'up' : 'down'
  if (h !== 0 && k !== 0) {
    return {
      parts: [`The graph of $${gname}$ is the graph of ${parent} translated `, { b: 'n1' }, ' units ', { b: 'd1' }, ' and ', { b: 'n2' }, ' units ', { b: 'd2' }, '.'],
      blanks: {
        n1: { kind: 'number', answer: Math.abs(h), why: amountWhy(Math.abs(h)) },
        d1: { kind: 'select', options: ['left', 'right'], answer: hDir, why: { [hDir === 'right' ? 'left' : 'right']: `Watch Out! The number inside is grouped with $x$: the graph moves the **opposite** way to the sign you see. Here $h = ${plain(h)}$.` } },
        n2: { kind: 'number', answer: Math.abs(k), why: amountWhy(Math.abs(k)) },
        d2: { kind: 'select', options: ['up', 'down'], answer: kDir, why: { [kDir === 'up' ? 'down' : 'up']: `The number outside is not grouped with $x$ and moves the graph the way its sign says. Here $k = ${plain(k)}$.` } },
      },
    }
  }
  if (k !== 0) {
    const sideways = `For $f(x) = x$ that lands on the same line, but the constant is **not grouped with $x$**, so describe the vertical move.`
    return {
      parts: [`The graph of $${gname}$ is the graph of ${parent} translated `, { b: 'n' }, ' units ', { b: 'd' }, '.'],
      blanks: {
        n: { kind: 'number', answer: Math.abs(k), why: amountWhy(Math.abs(k)) },
        d: { kind: 'select', options: DIRS, answer: kDir, why: { [kDir === 'up' ? 'down' : 'up']: `Check the sign of $k$: here $k = ${plain(k)}$.`, left: sideways, right: sideways } },
      },
    }
  }
  const vertical = `For $f(x) = x$ that lands on the same line, but the constant is **grouped with $x$**, so describe the horizontal move.`
  return {
    parts: [`The graph of $${gname}$ is the graph of ${parent} translated `, { b: 'n' }, ' units ', { b: 'd' }, '.'],
    blanks: {
      n: { kind: 'number', answer: Math.abs(h), why: amountWhy(Math.abs(h)) },
      d: {
        kind: 'select',
        options: DIRS,
        answer: hDir,
        why: { [hDir === 'right' ? 'left' : 'right']: `Watch Out! Inside, the sign does the opposite: here $h = ${plain(h)}$, so the graph moves ${hDir}.`, up: vertical, down: vertical },
      },
    },
  }
}

/** Dilation with factor a, inside (horizontal) or outside (vertical), with an optional reflection. */
export function dilationQ(a: number, inside: boolean, gname = 'g(x)'): { parts: Part[]; blanks: Record<string, Blank> } {
  const big = Math.abs(a) > 1
  const sc = inside ? (big ? 'compressed' : 'stretched') : big ? 'stretched' : 'compressed'
  const dir = inside ? 'horizontally' : 'vertically'
  const other = inside ? 'vertically' : 'horizontally'
  const scOther = sc === 'stretched' ? 'compressed' : 'stretched'
  const blanks: Record<string, Blank> = {
    sc: {
      kind: 'select',
      options: ['stretched', 'compressed'],
      answer: sc,
      why: {
        [scOther]: inside
          ? `Watch Out! Inside, it is the opposite: $|a| ${big ? '> 1' : '< 1'}$ ${big ? 'squeezes the graph toward the $y$-axis' : 'pulls the graph away from the $y$-axis'}.`
          : `Look at $|a| = ${plain(Math.abs(a))}$: ${big ? 'greater than 1 makes the graph steeper' : 'between 0 and 1 makes the graph less steep'}.`,
      },
    },
    dir: {
      kind: 'select',
      options: ['vertically', 'horizontally'],
      answer: dir,
      why: { [other]: inside ? 'The constant is **grouped with $x$**, so it changes the inputs: horizontal.' : 'The constant is **not grouped with $x$**, so it changes the outputs: vertical.' },
    },
  }
  const parts: Part[] = [`The graph of $${gname}$ is `, { b: 'sc' }, ' ', { b: 'dir' }]
  if (a < 0) {
    const axis = inside ? 'y-axis' : 'x-axis'
    blanks.ax = {
      kind: 'select',
      options: ['x-axis', 'y-axis'],
      answer: axis,
      why: { [inside ? 'x-axis' : 'y-axis']: inside ? 'The negative is **grouped with $x$**, so every $x$-coordinate flips sign: across the $y$-axis.' : 'The negative is **not grouped with $x$**, so every $y$-coordinate flips sign: across the $x$-axis.' },
    }
    parts.push(' and reflected across the ', { b: 'ax' })
  }
  parts.push('.')
  return { parts, blanks }
}

// ---------------- practice / check step ----------------

export interface PracticeDef {
  id: string
  part: PartId
  title: string
  page: string
  tag?: 'practice' | 'check'
  num?: string
  topic?: string
  prompt: string
  context?: string
  image?: string
  fn?: string
  /** the question(s); receives "revealed" for present mode */
  q: (revealed: boolean) => ReactNode
  /** id of the question whose success unlocks the graph */
  solvedBy: string
  graph?: { s: Spec; xs: number[] } | { f: [number, number]; g: [number, number]; v: string; view: View; xLabel?: string; yLabel?: string; names?: [string, string] }
  answer: string
  teamwork?: boolean
  /** her worked solution, shown once the question is answered */
  her?: { move: Move; fn: string }
}

function LockedGraph() {
  return (
    <div className="grid h-full min-h-[14rem] place-items-center rounded-2xl border-2 border-dashed border-line bg-canvas p-6 text-center">
      <div className="max-w-[16rem] space-y-2">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-muted shadow-sm">
          <Lock size={22} />
        </div>
        <div className="font-display text-[1.1rem] font-extrabold text-ink">Answer first</div>
        <p className="text-[0.95rem] font-semibold text-ink-2">Then Desmos shows the graph, so you can check that your answer makes sense.</p>
      </div>
    </div>
  )
}

function PracticeBody({ d, reveal, present }: { d: PracticeDef; reveal: number; present: boolean }) {
  const solved = useSolved(d.solvedBy)
  const open = solved || reveal >= 1
  const graph = d.graph
  return (
    <Split
      present={present}
      left={
        <>
          {d.topic && <SubTopic>{d.topic}</SubTopic>}
          <TagRow page={d.page}>
            {d.tag === 'check' ? <CheckTag /> : <PracticeTag />}
            {d.teamwork !== false && d.tag !== 'check' && <TeamWork />}
          </TagRow>
          {d.context && (
            <div className="flex items-start gap-3">
              {d.image && <Illus name={d.image} className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />}
              <p className="text-[1.04rem] leading-relaxed text-ink">
                <Md>{d.context}</Md>
              </p>
            </div>
          )}
          <p className="text-[1.08rem] font-bold leading-relaxed text-ink">
            {d.num && <span className="mr-2 font-display text-[1.2rem] font-extrabold text-ink">{d.num}.</span>}
            <span className="problem">
              <Md>{d.prompt}</Md>
            </span>
          </p>
          {d.fn && (
            <div className="rounded-2xl bg-canvas px-4 py-3 text-center text-[1.5rem]">
              <Tex>{d.fn}</Tex>
            </div>
          )}
          {d.q(reveal >= 1)}
          {open && d.her && (
            <div className="space-y-2">
              <SolutionTag />
              <SolLines lines={herSolution(d.her.move, d.her.fn).lines} shown={99} />
            </div>
          )}
          {open && <AnswerLine>{d.her ? herSolution(d.her.move, d.her.fn).answer : d.answer}</AnswerLine>}
        </>
      }
      right={
        !graph ? null : !open ? (
          <LockedGraph />
        ) : 's' in graph ? (
          <ConvinceGraph s={graph.s} xs={graph.xs} present={present} />
        ) : (
          <TwoLines f={graph.f} g={graph.g} v={graph.v} view={graph.view} present={present} names={graph.names} xLabel={graph.xLabel} yLabel={graph.yLabel} />
        )
      }
    />
  )
}

export function practiceStep(d: PracticeDef): StepDef {
  return {
    id: d.id,
    part: d.part,
    title: d.title,
    page: d.page,
    reveals: (m) => (m === 'present' ? 1 : 0),
    revealLabel: 'Show answer',
    render: ({ reveal, present }) => <PracticeBody d={d} reveal={reveal} present={present} />,
  }
}

/** Convenience: a describe-the-transformation sentence question. */
export function describe(id: string, q: { parts: Part[]; blanks: Record<string, Blank> }, hints: string[] = [], success?: string) {
  return (revealed: boolean) => <Sentence id={id} parts={q.parts} blanks={q.blanks} hints={hints} success={success} revealed={revealed} />
}
