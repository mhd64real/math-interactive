import { useState, type ReactNode } from 'react'
import { Check, Eye, Lightbulb, X } from 'lucide-react'
import { Md, Tex } from './Tex'
import { usePersist, write } from '../lib/store'
import { near, parseLinear, parseNumber, type Lin } from '../lib/linear'
import { tex } from '../lib/transform'

export type Part = string | { b: string }
export type Blank =
  | { kind: 'select'; options: string[]; answer: string | string[]; why?: Record<string, string> }
  | { kind: 'number'; answer: number; eps?: number; why?: (v: number) => string | undefined; size?: 'sm' | 'md' }

type Status = 'idle' | 'wrong' | 'right' | 'shown'

interface QState {
  values: Record<string, string>
  marks: Record<string, boolean>
  status: Status
  tries: number
  msg?: string
}
const fresh = (): QState => ({ values: {}, marks: {}, status: 'idle', tries: 0 })

function Feedback({ kind, children }: { kind: 'good' | 'bad' | 'hint'; children: ReactNode }) {
  const styles = {
    good: 'border-good/30 bg-good-soft text-good',
    bad: 'border-bad/25 bg-bad-soft text-bad',
    hint: 'border-primary/25 bg-primary-soft text-primary',
  }[kind]
  const Icon = kind === 'good' ? Check : kind === 'bad' ? X : Lightbulb
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border-2 px-3 py-2.5 font-bold leading-relaxed ${styles}`} role="status">
      <Icon size={20} className="mt-0.5 shrink-0" strokeWidth={3} />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

const answerOf = (b: Blank) => (b.kind === 'select' ? (Array.isArray(b.answer) ? b.answer[0] : b.answer) : String(b.answer))

function isRight(b: Blank, raw: string | undefined) {
  if (raw === undefined || raw === '') return false
  if (b.kind === 'select') return Array.isArray(b.answer) ? b.answer.includes(raw) : b.answer === raw
  const v = parseNumber(raw)
  return v !== null && near(v, b.answer, b.eps ?? 0.011)
}

function displayNumber(n: number) {
  return String(n).replace('-', '−')
}

interface SentenceProps {
  id: string
  parts: Part[]
  blanks: Record<string, Blank>
  hints?: string[]
  success?: string
  revealed?: boolean
  after?: ReactNode
}

/** A sentence with drop-down / number blanks, like the book's Check boxes. */
export function Sentence({ id, parts, blanks, hints = [], success, revealed = false, after }: SentenceProps) {
  const [st, setSt] = usePersist<QState>(`q:${id}`, fresh())
  const shown = revealed || st.status === 'shown'
  const done = st.status === 'right' || shown

  const setVal = (k: string, v: string) =>
    setSt((s) => ({ ...s, values: { ...s.values, [k]: v }, marks: { ...s.marks, [k]: undefined as unknown as boolean }, status: s.status === 'right' ? 'right' : 'idle', msg: undefined }))

  const check = () => {
    const marks: Record<string, boolean> = {}
    let firstWhy: string | undefined
    let allRight = true
    for (const [k, b] of Object.entries(blanks)) {
      const raw = st.values[k]
      const ok = isRight(b, raw)
      marks[k] = ok
      if (!ok) {
        allRight = false
        if (!firstWhy && raw) {
          if (b.kind === 'select') firstWhy = b.why?.[raw]
          else {
            const v = parseNumber(raw)
            firstWhy = v === null ? 'Type a number, like 7, -3 or 1/2.' : b.why?.(v)
          }
        }
      }
    }
    const tries = st.tries + 1
    const missing = Object.keys(blanks).some((k) => !st.values[k])
    const msg = allRight
      ? undefined
      : missing
        ? 'Fill in every blank first.'
        : firstWhy ?? hints[(tries - 1) % Math.max(hints.length, 1)] ?? 'Not quite. Look at the parts marked in red.'
    setSt({ ...st, marks, tries: missing ? st.tries : tries, status: allRight ? 'right' : 'wrong', msg })
    if (allRight) write(`solved:${id}`, true)
  }

  return (
    <div className="space-y-3">
      <p className="text-[1.1rem] font-semibold leading-[2.6] text-ink">
        {parts.map((p, i) => {
          if (typeof p === 'string') return <Md key={i}>{p}</Md>
          const b = blanks[p.b]
          const val = shown ? answerOf(b) : st.values[p.b] ?? ''
          const mark = shown ? true : st.marks[p.b]
          const cls = `field mx-1 align-middle ${mark === true ? 'is-good' : mark === false ? 'is-bad' : ''}`
          if (b.kind === 'select') {
            return (
              <select key={i} className={`${cls} min-w-[7.5rem]`} value={val} disabled={done} onChange={(e) => setVal(p.b, e.target.value)} aria-label="Choose an answer">
                <option value="" disabled>
                  choose
                </option>
                {b.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            )
          }
          return (
            <input
              key={i}
              className={`${cls} ${b.size === 'md' ? 'w-28' : 'w-20'} text-center`}
              inputMode="decimal"
              autoComplete="off"
              value={shown ? displayNumber(b.answer) : val}
              disabled={done}
              placeholder="?"
              onChange={(e) => setVal(p.b, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && check()}
              aria-label="Type a number"
            />
          )
        })}
      </p>

      {!done && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-primary" onClick={check}>
            Check
          </button>
          {st.tries >= 2 && (
            <button type="button" className="btn btn-ghost" onClick={() => { setSt({ ...st, status: 'shown', msg: undefined }); write(`solved:${id}`, true) }}>
              <Eye size={18} /> Show answer
            </button>
          )}
        </div>
      )}
      {st.status === 'wrong' && st.msg && <Feedback kind="bad"><Md>{st.msg}</Md></Feedback>}
      {st.status === 'right' && (
        <Feedback kind="good">
          <span>Correct! </span>
          {success && <Md>{success}</Md>}
        </Feedback>
      )}
      {st.status === 'shown' && !revealed && success && (
        <Feedback kind="hint">
          <Md>{success}</Md>
        </Feedback>
      )}
      {done && after}
    </div>
  )
}

export interface Choice {
  text: string
  correct?: boolean
  why?: string
}

interface ChoiceProps {
  id: string
  options: Choice[]
  letters?: boolean
  revealed?: boolean
  columns?: 1 | 2
  after?: ReactNode
  /** accept any option as a valid answer (each one explains itself) */
  open?: boolean
}

export function Choices({ id, options, letters = true, revealed = false, columns = 1, after, open = false }: ChoiceProps) {
  const [picked, setPicked] = usePersist<number[]>(`c:${id}`, [])
  const solved = open ? picked.length > 0 : picked.some((i) => options[i]?.correct)
  const last = picked[picked.length - 1]
  const lastOpt = last !== undefined ? options[last] : undefined
  return (
    <div className="space-y-3">
      <div className={`grid gap-2 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>
        {options.map((o, i) => {
          const tried = picked.includes(i)
          const good = (o.correct && (tried || revealed)) || (open && tried)
          const bad = !open && tried && !o.correct
          return (
            <button
              key={i}
              type="button"
              disabled={(solved && !open) || bad}
              onClick={() => {
                setPicked((p) => (p.includes(i) && !open ? p : [...p.filter((x) => x !== i), i]))
                if (o.correct || open) write(`solved:${id}`, true)
              }}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left font-semibold leading-snug transition-colors ${
                good ? 'border-good bg-good-soft text-ink' : bad ? 'border-bad/50 bg-bad-soft text-ink-2' : 'border-line bg-white text-ink hover:border-primary/50'
              }`}
            >
              {letters && (
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-extrabold ${good ? 'bg-good text-white' : bad ? 'bg-bad text-white' : 'bg-canvas text-ink-2'}`}>
                  {good ? <Check size={16} strokeWidth={3.5} /> : bad ? <X size={16} strokeWidth={3.5} /> : String.fromCharCode(65 + i)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <Md>{o.text}</Md>
              </span>
            </button>
          )
        })}
      </div>
      {lastOpt && (lastOpt.correct || open) && lastOpt.why && (
        <Feedback kind="good">
          {!open && <span>Correct! </span>}
          <Md>{lastOpt.why}</Md>
        </Feedback>
      )}
      {lastOpt && !lastOpt.correct && !open && (
        <Feedback kind="bad">
          <Md>{lastOpt.why ?? 'Not quite. Try another option.'}</Md>
        </Feedback>
      )}
      {revealed && !solved && options.find((o) => o.correct)?.why && (
        <Feedback kind="good">
          <Md>{options.find((o) => o.correct)!.why!}</Md>
        </Feedback>
      )}
      {(solved || revealed) && after}
    </div>
  )
}

interface FnProps {
  id: string
  v?: string
  lhs: string
  answer: Lin
  answerTex: string
  placeholder?: string
  hints?: string[]
  revealed?: boolean
  after?: ReactNode
}

/** Type a linear function, checked by meaning (3x + 11 = 11 + 3x). */
export function FunctionAnswer({ id, v = 'x', lhs, answer, answerTex, placeholder = 'e.g. 3x + 11', hints = [], revealed = false, after }: FnProps) {
  const [st, setSt] = usePersist<{ text: string; status: Status; tries: number; msg?: string }>(`f:${id}`, { text: '', status: 'idle', tries: 0 })
  const [touched, setTouched] = useState(false)
  const shown = revealed || st.status === 'shown'
  const done = st.status === 'right' || shown
  const parsed = parseLinear(st.text, v)

  const check = () => {
    setTouched(true)
    if (!st.text.trim()) return setSt({ ...st, status: 'wrong', msg: 'Type your function first.' })
    if (!parsed) return setSt({ ...st, status: 'wrong', msg: `I could not read that. Use the letter ${v}, like ${placeholder.replace('e.g. ', '')}.` })
    const okA = near(parsed.a, answer.a)
    const okB = near(parsed.b, answer.b)
    const tries = st.tries + 1
    if (okA && okB) {
      write(`solved:${id}`, true)
      return setSt({ ...st, status: 'right', tries, msg: undefined })
    }
    const msg = !okA && okB
      ? `The constant is right. Check the number in front of $${v}$.`
      : okA && !okB
        ? `The rate (the number in front of $${v}$) is right. Check the constant.`
        : hints[(tries - 1) % Math.max(hints.length, 1)] ?? 'Not quite. Start from the original function and apply the change.'
    setSt({ ...st, status: 'wrong', tries, msg })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[1.15rem]">
        <Tex>{lhs}</Tex>
        {shown ? (
          <span className="field inline-flex items-center border-good bg-good-soft text-good">
            <Tex>{answerTex}</Tex>
          </span>
        ) : (
          <input
            className={`field w-48 ${st.status === 'right' ? 'is-good' : st.status === 'wrong' && touched ? 'is-bad' : ''}`}
            value={st.text}
            disabled={done}
            placeholder={placeholder}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            onChange={(e) => setSt({ ...st, text: e.target.value, status: st.status === 'right' ? 'right' : 'idle', msg: undefined })}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            aria-label="Type the function"
          />
        )}
        {!shown && parsed && st.text.trim() && (
          <span className="text-sm font-bold text-muted">
            reads as <Tex>{`${parsed.a === 0 ? '' : `${parsed.a === 1 ? '' : parsed.a === -1 ? '-' : tex(parsed.a)}${v}`}${parsed.b === 0 && parsed.a !== 0 ? '' : parsed.b >= 0 && parsed.a !== 0 ? `+${tex(parsed.b)}` : tex(parsed.b)}`}</Tex>
          </span>
        )}
      </div>
      {!done && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-primary" onClick={check}>
            Check
          </button>
          {st.tries >= 2 && (
            <button type="button" className="btn btn-ghost" onClick={() => { setSt({ ...st, status: 'shown', msg: undefined }); write(`solved:${id}`, true) }}>
              <Eye size={18} /> Show answer
            </button>
          )}
        </div>
      )}
      {st.status === 'wrong' && st.msg && <Feedback kind="bad"><Md>{st.msg}</Md></Feedback>}
      {st.status === 'right' && <Feedback kind="good">Correct!</Feedback>}
      {done && after}
    </div>
  )
}

export function AnswerLine({ children }: { children: string }) {
  return (
    <p className="text-[1.12rem] font-extrabold leading-relaxed text-answer">
      <Md>{children}</Md>
    </p>
  )
}
