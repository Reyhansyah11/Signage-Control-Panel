import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import type { Device } from '../../types/api'

const MAX_DEVICES = 8

/**
 * Jumlah item playlist untuk beberapa device pertama. Diambil sekali per daftar device (bukan setiap
 * status berubah). Device yang gagal dimuat dilewati, bukan ditampilkan sebagai nol.
 */
export function usePlaylistCounts(devices: Device[] | null): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const idsKey = devices ? devices.slice(0, MAX_DEVICES).map((device) => device.id).join(',') : ''

  useEffect(() => {
    if (!idsKey) return undefined
    let cancelled = false
    const ids = idsKey.split(',')

    void Promise.allSettled(ids.map((id) => apiFetch<unknown[]>(`/devices/${id}/playlist`))).then((results) => {
      if (cancelled) return
      const next: Record<string, number> = {}
      results.forEach((result, index) => {
        const id = ids[index]
        if (id !== undefined && result.status === 'fulfilled') next[id] = result.value.length
      })
      setCounts(next)
    })

    return () => {
      cancelled = true
    }
  }, [idsKey])

  return counts
}
