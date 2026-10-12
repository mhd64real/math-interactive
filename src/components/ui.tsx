import { useState, type ReactNode } from 'react'
import { Eye } from 'lucide-react'
import { Md } from './Tex'

// The teacher's slide vocabulary, rebuilt as web components.

const LETTERS = ['text-l1', 'text-l2', 'text-l3', 'text-l4', 'text-l5', 'text-l6']

export function Bubble({ text, className = '' }: { text: string; className?: string }) {
  let k = 0
  return (
    <span className={`bubble inline-flex select-none ${className}`} aria-label={text}>
      {text.split('').map((ch, i) =>
        ch === ' ' ? (
          <span key={i} className="w-[0.3em]" />
        ) : (
          <span key={i} aria-hidden className={LETTERS[k++ % LETTERS.length]}>
            {ch}
          </span>
        ),
      )}
    </span>
  )
}

export function ExampleTag({ n }: { n?: number | string }) {
  return (
    <span className="inline-flex items-center rounded-[0.3rem] bg-example px-2.5 pt-0.5 font-display text-[1.05rem] font-extrabold uppercase leading-7 tracking-wide text-white shadow-sm">
      Example{n !== undefined ? ` ${n}` : ''}
    </span>
  )
}

export function PracticeTag({ label = 'Practice' }: { label?: string }) {
  return (
    <span className="relative mb-2 inline-flex items-center rounded-md bg-practice px-3 pt-0.5 font-display text-[1.05rem] font-extrabold uppercase leading-7 tracking-wide text-white shadow-sm">
      {label}
      <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[9px] border-t-[8px] border-x-transparent border-t-practice" />
    </span>
  )
}

export function CheckTag() {
  return <Bubble text="CHECK" className="text-[1.85rem]" />
}

export function SolutionTag({ label = 'Solution' }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-[0.3rem] bg-solution px-2 pt-0.5 font-display text-[0.85rem] font-extrabold uppercase leading-6 tracking-wide text-white">
      {label}
    </span>
  )
}

export function WarmUpTitle() {
  return (
    <span className="inline-flex rounded-xl bg-gradient-to-b from-wood to-wood-2 px-4 py-2 shadow-[inset_0_-4px_0_rgb(0_0_0/0.12)]">
      <Bubble text="WARM UP" className="text-[2rem]" />
    </span>
  )
}

export function VocabTitle() {
  return (
    <span className="inline-flex flex-col items-start leading-none">
      <span className="font-display text-[1.6rem] font-extrabold italic text-l3">New</span>
      <span className="-mt-1 rounded-lg bg-example px-3 pb-1 pt-1.5 font-display text-[2rem] font-extrabold text-white shadow-sm">Vocabulary</span>
    </span>
  )
}

export function KeyTakeawaysTag({ label = 'Key Takeaways' }: { label?: string }) {
  return (
    <span className="inline-block -skew-x-6 bg-example px-4 pt-1 font-display text-[1.15rem] font-extrabold uppercase leading-8 tracking-wide text-white shadow-md">
      <span className="inline-block skew-x-6">{label}</span>
    </span>
  )
}

export function PagePill({ page }: { page: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border-2 border-page bg-white px-2.5 text-[0.85rem] font-extrabold leading-6 text-page shadow-sm">
      {page}
    </span>
  )
}

export function OutcomePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-xl border-2 border-outcome-edge bg-outcome px-3 py-1 text-[0.85rem] font-extrabold leading-snug text-outcome-ink shadow-[inset_0_-3px_0_rgb(0_0_0/0.07)]">
      <span className="truncate">{children}</span>
    </span>
  )
}

export function SubTopic({ children }: { children: string }) {
  return (
    <div className="inline-block rounded-md bg-tab/70 px-2.5 py-0.5 text-[1.05rem] font-bold text-ink">
      <span className="mr-1.5 text-tab-ink">&bull;</span>
      <Md>{children}</Md>
    </div>
  )
}

export function Illus({ name, className = '' }: { name: string; className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}img/${name}.webp`}
      alt=""
      aria-hidden
      draggable={false}
      loading="lazy"
      decoding="async"
      className={`pointer-events-none select-none object-contain ${className}`}
      onError={(e) => {
        e.currentTarget.style.visibility = 'hidden'
      }}
    />
  )
}

export function Remember({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-remember-edge bg-remember-soft p-3 pr-4">
      <Illus name="remember" className="h-11 w-11 shrink-0" />
      <div className="pt-1 leading-relaxed">
        <span className="mr-1 font-extrabold text-practice">Remember:</span>
        {typeof children === 'string' ? <Md>{children}</Md> : children}
      </div>
    </div>
  )
}

export function WatchOut({ title = 'Watch Out!', children }: { title?: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-watch-edge bg-watch-soft p-3 pr-4">
      <Illus name="watchout" className="h-12 w-12 shrink-0" />
      <div className="pt-0.5 leading-relaxed">
        <div className="font-display text-[1.1rem] font-extrabold text-watch-ink">{title}</div>
        {typeof children === 'string' ? <Md>{children}</Md> : children}
      </div>
    </div>
  )
}

export function ThinkAbout({ title = 'Think About It!', children, image = 'think' }: { title?: string; children: ReactNode; image?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-think-edge bg-think-soft p-3 pr-4">
      <Illus name={image} className="h-14 w-14 shrink-0" />
      <div className="pt-0.5 leading-relaxed">
        <div className="font-display text-[1.1rem] font-extrabold text-think-ink">{title}</div>
        {typeof children === 'string' ? <Md>{children}</Md> : children}
      </div>
    </div>
  )
}

export function TeamWork() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border-2 border-line bg-white py-0.5 pl-1 pr-3 text-[0.8rem] font-extrabold uppercase tracking-wide text-ink-2">
      <Illus name="teamwork" className="h-8 w-8" />
      Team work
    </span>
  )
}

export function ConceptCard({ title, label = 'Key Concept', children }: { title: string; label?: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[1.4rem] border-2 border-white bg-gradient-to-br from-concept to-concept-2 shadow-[0_0_0_2px_var(--color-line)]">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-white/80 bg-white/60 px-4 py-2.5">
        <span className="rounded-md bg-primary px-2 pt-0.5 font-display text-[0.8rem] font-extrabold uppercase leading-6 tracking-wider text-white">{label}</span>
        <h3 className="font-display text-[1.25rem] font-extrabold leading-tight text-ink">
          <Md>{title}</Md>
        </h3>
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

export function Move({ dir, children }: { dir: 'v' | 'h'; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 text-[0.92em] font-extrabold ${dir === 'v' ? 'bg-vert-soft text-vert' : 'bg-horiz-soft text-horiz'}`}>
      {children}
    </span>
  )
}

export function H2({ children }: { children: string }) {
  return (
    <h2 className="font-display text-[1.45rem] font-extrabold leading-tight text-ink sm:text-[1.6rem]">
      <Md>{children}</Md>
    </h2>
  )
}

export function P({ children, className = '' }: { children: string; className?: string }) {
  return (
    <p className={`text-[1.05rem] leading-relaxed text-ink-2 ${className}`}>
      <Md>{children}</Md>
    </p>
  )
}

export function Problem({ children }: { children: string }) {
  return (
    <p className="text-[1.1rem] font-bold leading-relaxed text-ink">
      <span className="problem">
        <Md>{children}</Md>
      </span>
    </p>
  )
}

/** Think About It card with a hidden sample answer. */
export function ThinkReveal({ title, text, answer, forceOpen = false }: { title?: string; text: string; answer: string; forceOpen?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <ThinkAbout title={title}>
      <Md>{text}</Md>
      <div className="mt-2">
        {open || forceOpen ? (
          <p className="rounded-xl bg-white/80 px-3 py-2 font-bold text-think-ink">
            <Md>{answer}</Md>
          </p>
        ) : (
          <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[0.9rem] font-extrabold text-think-ink shadow-sm" onClick={() => setOpen(true)}>
            <Eye size={16} /> Show a sample answer
          </button>
        )}
      </div>
    </ThinkAbout>
  )
}
