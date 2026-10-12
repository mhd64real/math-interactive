// A tiny parser for linear expressions typed by students ("3x + 11", "210 + 10w",
// "-1/2x + 5", "(x - 6) + 3", "x/4"). Returns the expression as a*v + b, or null.

export type Lin = { a: number; b: number }

type Tok = { t: 'num'; v: number } | { t: 'var' } | { t: 'op'; v: string }

function normalise(src: string) {
  let s = src
    .replace(/[\u2212\u2013\u2014]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/\s+/g, '')
    .toLowerCase()
  // Drop a leading "g(x)=" / "y=" style prefix.
  const eq = s.lastIndexOf('=')
  if (eq >= 0) s = s.slice(eq + 1)
  return s
}

function tokenize(s: string, v: string): Tok[] | null {
  const out: Tok[] = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (/[0-9.]/.test(c)) {
      const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i))
      if (!m) return null
      out.push({ t: 'num', v: parseFloat(m[1]) })
      i += m[1].length
    } else if (c === v) {
      out.push({ t: 'var' })
      i++
    } else if ('+-*/()'.includes(c)) {
      out.push({ t: 'op', v: c })
      i++
    } else {
      return null
    }
  }
  return out
}

export function parseLinear(src: string, v = 'x'): Lin | null {
  const s = normalise(src)
  if (!s) return null
  const tokens = tokenize(s, v)
  if (!tokens) return null
  const toks: Tok[] = tokens
  let p = 0
  const peek = () => toks[p]
  const isOp = (o: string) => {
    const k = toks[p]
    return k !== undefined && k.t === 'op' && k.v === o
  }

  const mul = (x: Lin, y: Lin): Lin | null => {
    if (x.a !== 0 && y.a !== 0) return null
    return { a: x.a * y.b + y.a * x.b, b: x.b * y.b }
  }

  function expr(): Lin | null {
    let left = term()
    while (left && (isOp('+') || isOp('-'))) {
      const op = (toks[p++] as { v: string }).v
      const right = term()
      if (!right) return null
      left = op === '+' ? { a: left.a + right.a, b: left.b + right.b } : { a: left.a - right.a, b: left.b - right.b }
    }
    return left
  }

  function term(): Lin | null {
    let left = factor()
    for (;;) {
      if (!left) return null
      if (isOp('*')) {
        p++
        const r = factor()
        if (!r) return null
        left = mul(left, r)
      } else if (isOp('/')) {
        p++
        const r = factor()
        if (!r || r.a !== 0 || r.b === 0) return null
        left = { a: left.a / r.b, b: left.b / r.b }
      } else {
        const k = peek()
        // Implicit multiplication: 2x, 3(x+1), (x+1)(2)
        if (k && (k.t === 'num' || k.t === 'var' || (k.t === 'op' && k.v === '('))) {
          const r = factor()
          if (!r) return null
          left = mul(left, r)
        } else {
          return left
        }
      }
    }
  }

  function factor(): Lin | null {
    if (isOp('-')) {
      p++
      const f = factor()
      return f ? { a: -f.a, b: -f.b } : null
    }
    if (isOp('+')) {
      p++
      return factor()
    }
    const k = toks[p]
    if (!k) return null
    if (k.t === 'num') {
      p++
      return { a: 0, b: k.v }
    }
    if (k.t === 'var') {
      p++
      return { a: 1, b: 0 }
    }
    if (k.t === 'op' && k.v === '(') {
      p++
      const e = expr()
      if (!e || !isOp(')')) return null
      p++
      return e
    }
    return null
  }

  const result = expr()
  if (!result || p !== toks.length) return null
  if (!Number.isFinite(result.a) || !Number.isFinite(result.b)) return null
  return result
}

/** Parse a plain number answer such as "7", "-3.25", "1/3". */
export function parseNumber(src: string): number | null {
  const r = parseLinear(src, '\u0000')
  if (!r || r.a !== 0) return null
  return r.b
}

export const near = (x: number, y: number, eps = 1e-6) => Math.abs(x - y) <= eps
