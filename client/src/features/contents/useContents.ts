import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import type { Content, ContentType } from '../../types/api'

/** Isi form konten: teks atau tautan dikirim sebagai JSON, file dikirim sebagai multipart. */
export type ContentSubmit =
  | { kind: 'json'; judul: string; tipe: ContentType; payload: string }
  | { kind: 'upload'; judul: string; file: File }

export interface ContentUpdate {
  judul: string
  payload: string
}

const newestFirst = (a: Content, b: Content): number => b.createdAt.localeCompare(a.createdAt)

export function useContents() {
  const [contents, setContents] = useState<Content[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch<Content[]>('/contents')
      .then((list) => {
        if (!cancelled) setContents([...list].sort(newestFirst))
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat konten.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const createContent = useCallback(async (input: ContentSubmit): Promise<void> => {
    let created: Content
    if (input.kind === 'upload') {
      const form = new FormData()
      form.append('judul', input.judul)
      form.append('file', input.file)
      created = await apiFetch<Content>('/contents/upload', { method: 'POST', body: form })
    } else {
      const { judul, tipe, payload } = input
      created = await apiFetch<Content>('/contents', { method: 'POST', body: { judul, tipe, payload } })
    }
    setContents((current) => [...(current ?? []), created].sort(newestFirst))
  }, [])

  const updateContent = useCallback(async (id: string, input: ContentUpdate): Promise<void> => {
    const updated = await apiFetch<Content>(`/contents/${id}`, { method: 'PATCH', body: input })
    setContents((current) =>
      current ? current.map((content) => (content.id === id ? updated : content)) : current,
    )
  }, [])

  const deleteContent = useCallback(async (id: string): Promise<void> => {
    await apiFetch<void>(`/contents/${id}`, { method: 'DELETE' })
    setContents((current) => (current ? current.filter((content) => content.id !== id) : current))
  }, [])

  return { contents, error, createContent, updateContent, deleteContent }
}
