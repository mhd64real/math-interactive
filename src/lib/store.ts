import { useCallback, useEffect, useState } from 'react'

// Session memory with a localStorage backup. localStorage can be missing or throw
// (private mode, blocked storage), so every access is guarded and the app works without it.
const PREFIX = 'mi44:'
const cache = new Map<string, unknown>()
const listeners = new Map<string, Set<() => void>>()

function read<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw !== null) {
      const v = JSON.parse(raw) as T
      cache.set(key, v)
      return v
    }
  } catch {
    /* storage unavailable */
  }
  return fallback
}

export function write<T>(key: string, value: T) {
  cache.set(key, value)
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
  listeners.get(key)?.forEach((f) => f())
}

export function usePersist<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => read(key, fallback))
  useEffect(() => {
    const on = () => setValue(read(key, fallback))
    let set = listeners.get(key)
    if (!set) listeners.set(key, (set = new Set()))
    set.add(on)
    return () => {
      set!.delete(on)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const update = useCallback(
    (v: T | ((prev: T) => T)) => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(read(key, fallback)) : v
      write(key, next)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )
  return [value, update] as const
}

export function resetAll() {
  cache.clear()
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => window.localStorage.removeItem(k))
  } catch {
    /* storage unavailable */
  }
}
