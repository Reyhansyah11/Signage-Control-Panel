import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import type { Content, ContentType } from '../../types/api'

export const DEFAULT_DURATION = 10

export interface PlaylistEntry {
  /** Kunci React: id baris dari server, atau penanda sementara untuk item yang baru ditambah. */
  key: string
  contentId: string
  judul: string
  tipe: ContentType
  durasiDetik: number
}

interface PlaylistItemResponse {
  id: string
  contentId: string
  urutan: number
  durasiDetik: number
  content: Content
}

let draftSeq = 0

const toEntry = (item: PlaylistItemResponse): PlaylistEntry => ({
  key: item.id,
  contentId: item.contentId,
  judul: item.content.judul,
  tipe: item.content.tipe,
  durasiDetik: item.durasiDetik,
})

/** Isi playlist yang menentukan "ada perubahan atau tidak": hanya urutan, konten, dan durasi. */
const signature = (entries: PlaylistEntry[]): string =>
  JSON.stringify(entries.map((entry) => [entry.contentId, entry.durasiDetik]))

/** Playlist satu device: draft yang bisa diedit, penyimpanan ke server, dan perintah push. */
export function usePlaylist(deviceId: string) {
  const [entries, setEntries] = useState<PlaylistEntry[] | null>(null)
  const [savedSignature, setSavedSignature] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch<PlaylistItemResponse[]>(`/devices/${deviceId}/playlist`)
      .then((items) => {
        if (cancelled) return
        const loaded = [...items].sort((a, b) => a.urutan - b.urutan).map(toEntry)
        setEntries(loaded)
        setSavedSignature(signature(loaded))
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat playlist.')
      })
    return () => {
      cancelled = true
    }
  }, [deviceId])

  const addContent = useCallback((content: Content): void => {
    setEntries((current) =>
      current
        ? [
            ...current,
            {
              key: `draft-${++draftSeq}`,
              contentId: content.id,
              judul: content.judul,
              tipe: content.tipe,
              durasiDetik: DEFAULT_DURATION,
            },
          ]
        : current,
    )
  }, [])

  const removeEntry = useCallback((key: string): void => {
    setEntries((current) => (current ? current.filter((entry) => entry.key !== key) : current))
  }, [])

  const moveEntry = useCallback((key: string, direction: -1 | 1): void => {
    setEntries((current) => {
      if (!current) return current
      const from = current.findIndex((entry) => entry.key === key)
      const to = from + direction
      if (from < 0 || to < 0 || to >= current.length) return current
      const next = [...current]
      const [moved] = next.splice(from, 1)
      if (!moved) return current
      next.splice(to, 0, moved)
      return next
    })
  }, [])

  const setDuration = useCallback((key: string, durasiDetik: number): void => {
    setEntries((current) =>
      current ? current.map((entry) => (entry.key === key ? { ...entry, durasiDetik } : entry)) : current,
    )
  }, [])

  const save = useCallback(async (): Promise<void> => {
    if (!entries) return
    setSaving(true)
    setError(null)
    try {
      const items = await apiFetch<PlaylistItemResponse[]>(`/devices/${deviceId}/playlist`, {
        method: 'PUT',
        body: { items: entries.map(({ contentId, durasiDetik }) => ({ contentId, durasiDetik })) },
      })
      const saved = [...items].sort((a, b) => a.urutan - b.urutan).map(toEntry)
      setEntries(saved)
      setSavedSignature(signature(saved))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan playlist.')
    } finally {
      setSaving(false)
    }
  }, [deviceId, entries])

  /** Perintah sesaat: tampilkan satu konten di device sekarang juga, playlist tidak berubah. */
  const pushContent = useCallback(
    async (contentId: string, durasiDetik: number): Promise<void> => {
      await apiFetch<void>(`/devices/${deviceId}/push`, { method: 'POST', body: { contentId, durasiDetik } })
    },
    [deviceId],
  )

  const dirty = entries !== null && signature(entries) !== savedSignature

  return { entries, dirty, saving, error, addContent, removeEntry, moveEntry, setDuration, save, pushContent }
}
