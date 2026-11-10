import { Link } from 'react-router-dom'
import { StatusBadge } from '../features/devices/StatusBadge'
import { useDevices } from '../features/devices/useDevices'
import { useContents } from '../features/contents/useContents'

const MAX_LISTED_DEVICES = 8

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value ?? '–'}</p>
    </div>
  )
}

/** Ringkasan: angka device dan konten, dengan status device yang berubah real-time. */
export default function DashboardPage() {
  const { devices, error: devicesError, connected } = useDevices()
  const { contents, error: contentsError } = useContents()
  const error = devicesError ?? contentsError

  const totalDevice = devices?.length ?? null
  const deviceOnline = devices ? devices.filter((device) => device.status === 'online').length : null
  const totalKonten = contents?.length ?? null

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ringkasan</h1>
          <p className="mt-1 text-sm text-slate-500">Gambaran singkat device dan konten.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500" aria-live="polite">
          <span className={`size-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {connected ? 'Real-time aktif' : 'Menyambungkan...'}
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total device" value={totalDevice} />
        <StatCard label="Device online" value={deviceOnline} />
        <StatCard label="Total konten" value={totalKonten} />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Status device</h2>
          <Link to="/devices" className="text-sm text-indigo-600 hover:underline">
            Lihat semua device
          </Link>
        </div>

        {devices?.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">Belum ada device. Tambah di menu Device.</p>
        )}

        {devices && devices.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100">
            {devices.slice(0, MAX_LISTED_DEVICES).map((device) => (
              <li key={device.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{device.nama}</p>
                  <p className="truncate text-xs text-slate-500">{device.lokasi}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={device.status} />
                  <Link
                    to={`/devices/${device.id}`}
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    Kelola
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
