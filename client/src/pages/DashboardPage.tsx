import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import type { Content, Device } from '../types/api'

interface Summary {
  totalDevice: number
  deviceOnline: number
  totalKonten: number
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value ?? '–'}</p>
    </div>
  )
}

// Halaman sementara: membuktikan token terkirim ke endpoint admin. Akan diganti halaman Device dan Konten.
export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([apiFetch<Device[]>('/devices'), apiFetch<Content[]>('/contents')])
      .then(([devices, contents]) => {
        if (cancelled) return
        setSummary({
          totalDevice: devices.length,
          deviceOnline: devices.filter((device) => device.status === 'online').length,
          totalKonten: contents.length,
        })
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat data.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Ringkasan</h1>
      <p className="mt-1 text-sm text-slate-500">Gambaran singkat device dan konten.</p>

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total device" value={summary?.totalDevice ?? null} />
        <StatCard label="Device online" value={summary?.deviceOnline ?? null} />
        <StatCard label="Total konten" value={summary?.totalKonten ?? null} />
      </div>
    </section>
  )
}
