import type { ReactNode } from 'react'
import { Md } from '../components/Tex'
import { TransformDemo } from '../components/Plane'
import { ConceptCard, PagePill, SubTopic } from '../components/ui'
import type { Spec } from '../lib/transform'
import { Legend, type PartId, type StepDef } from './kit'

export interface Case {
  head: string
  s: Spec
  xs: number[]
  foot: string
  x?: [number, number]
  y?: [number, number]
}

export function TwoCase({ cases, present }: { cases: Case[]; present: boolean }) {
  return (
    <div className={`grid gap-4 ${present ? 'grid-cols-2' : 'sm:grid-cols-2'}`}>
      {cases.map((c) => (
        <div key={c.head} className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm">
          <div className="font-bold leading-snug text-ink">
            <Md>{c.head}</Md>
          </div>
          <TransformDemo s={c.s} xs={c.xs} x={c.x ?? [-5, 5]} y={c.y ?? [-5, 5]} className={`mx-auto w-full ${present ? 'max-w-[13.5rem]' : 'max-w-[17rem]'}`} />
          <div className="mt-auto text-[0.95rem] font-semibold leading-snug text-ink-2">
            <Md>{c.foot}</Md>
          </div>
        </div>
      ))}
    </div>
  )
}

export interface ConceptDef {
  id: string
  part: PartId
  title: string
  page: string
  topic: string
  intro: string
  cardTitle: string
  lead: string
  cases: Case[]
  after?: ReactNode
}

export function conceptStep(d: ConceptDef): StepDef {
  return {
    id: d.id,
    part: d.part,
    title: d.title,
    page: d.page,
    render: ({ present }) => (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SubTopic>{d.topic}</SubTopic>
          <PagePill page={d.page} />
        </div>
        <p className="text-[1.05rem] leading-relaxed text-ink-2">
          <Md>{d.intro}</Md>
        </p>
        <ConceptCard title={d.cardTitle}>
          <p className="mb-3 text-[1.05rem] font-bold text-ink">
            <Md>{d.lead}</Md>
          </p>
          <TwoCase cases={d.cases} present={present} />
          <div className="mt-3">
            <Legend />
          </div>
        </ConceptCard>
        {d.after}
      </div>
    ),
  }
}
