import { useEffect, useRef, useState } from 'react'

const easeOut = (progress: number): number => 1 - (1 - progress) ** 3

/**
 * Angka yang menghitung naik dari nilai sebelumnya ke target. Mengembalikan null selama
 * target belum ada. Tanpa animasi bila pengguna meminta gerak dikurangi.
 */
export function useCountUp(target: number | null, duration = 700): number | null {
  const [value, setValue] = useState<number | null>(null)
  const shown = useRef(0)

  useEffect(() => {
    if (target === null) return undefined
    const from = shown.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    let frame = 0

    const tick = (now: number): void => {
      const progress = reduced ? 1 : Math.min(Math.max((now - start) / duration, 0), 1)
      const next = Math.round(from + (target - from) * easeOut(progress))
      shown.current = next
      setValue(next)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}
