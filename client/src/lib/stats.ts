import type { Content, ContentType } from '../types/api'

export interface DayCount {
  /** Kunci hari lokal, contohnya 2026-11-10. */
  key: string
  /** Tanggal pendek untuk sumbu grafik, contohnya 10. */
  label: string
  /** Keterangan lengkap untuk tooltip, contohnya 10 Nov. */
  title: string
  count: number
}

const pad = (value: number): string => String(value).padStart(2, '0')

const dayKey = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** Jumlah konten per tipe; semua tipe selalu ada, termasuk yang jumlahnya nol. */
export function contentsByType(contents: Content[]): Record<ContentType, number> {
  const counts: Record<ContentType, number> = { text: 0, image: 0, video: 0, url: 0 }
  for (const content of contents) counts[content.tipe] += 1
  return counts
}

/** Jumlah konten yang dibuat pada tiap hari, `days` hari terakhir sampai hari ini (waktu lokal). */
export function contentsPerDay(contents: Content[], days: number, today: Date = new Date()): DayCount[] {
  const buckets = new Map<string, DayCount>()
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
    buckets.set(dayKey(date), {
      key: dayKey(date),
      label: String(date.getDate()),
      title: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      count: 0,
    })
  }
  for (const content of contents) {
    const bucket = buckets.get(dayKey(new Date(content.createdAt)))
    if (bucket) bucket.count += 1
  }
  return [...buckets.values()]
}
