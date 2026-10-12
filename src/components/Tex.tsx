import katex from 'katex'
import { Fragment, useMemo, type ReactNode } from 'react'

// Colour macros: \vt{..} outside / vertical (pink), \hz{..} inside / horizontal (blue),
// \gx{..} g(x) green, \ans{..} final answer orange, \pa{..} parent ink.
const macros = {
  '\\vt': '\\textcolor{##d63384}{#1}',
  '\\hz': '\\textcolor{##1c7ed6}{#1}',
  '\\gx': '\\textcolor{##2f9e44}{#1}',
  '\\ans': '\\textcolor{##cf4b14}{#1}',
  '\\pa': '\\textcolor{##2a2f3b}{#1}',
  '\\red': '\\textcolor{##e03131}{#1}',
}

export function Tex({ children, block = false, className }: { children: string; block?: boolean; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(children, { throwOnError: false, displayMode: block, strict: 'ignore', macros: { ...macros } }),
    [children, block],
  )
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

/** Text with inline math between $...$ and **bold** runs (math may sit inside bold). */
export function Md({ children, className }: { children: string; className?: string }) {
  // "\\$" is a literal dollar sign (prices); every other $...$ pair is math.
  const runs = useMemo(() => children.replace(/\\\$/g, '\u0000').split('**'), [children])
  let math = false
  return (
    <span className={className}>
      {runs.map((run, r) => {
        const out: ReactNode[] = []
        run.split('$').forEach((p, i) => {
          if (i > 0) math = !math
          if (!p) return
          out.push(math ? <Tex key={i}>{p.replace(/\u0000/g, '\\$')}</Tex> : <Fragment key={i}>{p.replace(/\u0000/g, '$')}</Fragment>)
        })
        return r % 2 === 1 ? (
          <strong key={r} className="font-extrabold">
            {out}
          </strong>
        ) : (
          <Fragment key={r}>{out}</Fragment>
        )
      })}
    </span>
  )
}
