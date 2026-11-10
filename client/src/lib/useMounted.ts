import { useEffect, useState } from 'react'

/** False pada render pertama, true setelah satu frame; dipakai agar grafik tumbuh dari nol. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return mounted
}
