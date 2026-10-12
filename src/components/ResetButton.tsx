import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { resetAll } from '../lib/store'

/** Clears every saved answer on this device and restarts the lesson. Asks once to confirm. */
export default function ResetButton({ label = 'Reset my answers', className = '' }: { label?: string; className?: string }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = window.setTimeout(() => setArmed(false), 4000)
    return () => window.clearTimeout(t)
  }, [armed])
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[0.85rem] font-extrabold ${armed ? 'bg-bad-soft text-bad' : 'text-muted hover:text-ink'} ${className}`}
      onClick={() => {
        if (!armed) return setArmed(true)
        resetAll()
        window.location.hash = '#/learn/start'
        window.location.reload()
      }}
    >
      <RotateCcw size={16} /> {armed ? 'Tap again to erase everything' : label}
    </button>
  )
}
