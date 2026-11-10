import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BarList } from '../components/charts/BarList'
import { CHART_COLORS } from '../components/charts/colors'
import { ColumnChart } from '../components/charts/ColumnChart'
import { DonutChart } from '../components/charts/DonutChart'
import { ChartCard } from '../components/ChartCard'
import { useAuth } from '../features/auth/useAuth'
import { StatusBadge } from '../features/devices/StatusBadge'
import { useDevices } from '../features/devices/useDevices'
import { usePlaylistCounts } from '../features/devices/usePlaylistCounts'
import { useContents } from '../features/contents/useContents'
import { contentsByType, contentsPerDay } from '../lib/stats'
import { useCountUp } from '../lib/useCountUp'

const MAX_LISTED_DEVICES = 8
const CHART_DAYS = 14

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const MonitorIcon = () => (
  <Icon>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </Icon>
)
const SignalIcon = () => (
  <Icon>
    <path d="M5 12.55a11 11 0 0 1 14 0M8.5 16a6 6 0 0 1 7 0M12 20h.01" />
  </Icon>
)
const ImageIcon = () => (
  <Icon>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-5-5L5 21" />
  </Icon>
)

interface StatCardProps {
  label: string
  value: number | null
  icon: ReactNode
  delay: number
}

function StatCard({ label, value, icon, delay }: StatCardProps) {
  const shown = useCountUp(value)
  return (
    <div
      className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{shown ?? '–'}</p>
    </div>
  )
}

/** Ringkasan: angka, grafik, dan status device yang berubah real-time. */
export default function DashboardPage() {
  const { username } = useAuth()
  const { devices, error: devicesError, connected } = useDevices()
  const { contents, error: contentsError } = useContents()
  const playlistCounts = usePlaylistCounts(devices)
  const error = devicesError ?? contentsError

  const totalDevice = devices?.length ?? null
  const deviceOnline = devices ? devices.filter((device) => device.status === 'online').length : null
  const totalKonten = contents?.length ?? null

  const types = contents ? contentsByType(contents) : null
  const perDay = contents ? contentsPerDay(contents, CHART_DAYS) : []
  const playlistBars = (devices ?? [])
    .slice(0, MAX_LISTED_DEVICES)
    .filter((device) => playlistCounts[device.id] !== undefined)
    .map((device) => ({ label: device.nama, value: playlistCounts[device.id] ?? 0 }))

  return (
    <section className="space-y-6">
      <div className="animate-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-900 via-brand-800 to-brand-600 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -top-20 -right-16 size-72 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-brand-100/80">Selamat datang, {username || 'admin'}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Ringkasan operasional</h1>
            <p className="mt-2 text-sm text-brand-100/90">
              {totalDevice === null || deviceOnline === null
                ? 'Memuat data device...'
                : `${deviceOnline} dari ${totalDevice} device sedang online.`}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs" aria-live="polite">
            <span className={`size-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {connected ? 'Real-time aktif' : 'Menyambungkan...'}
          </span>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total device" value={totalDevice} icon={<MonitorIcon />} delay={80} />
        <StatCard label="Device online" value={deviceOnline} icon={<SignalIcon />} delay={160} />
        <StatCard label="Total konten" value={totalKonten} icon={<ImageIcon />} delay={240} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Status device" description="Online dan offline saat ini, diperbarui real-time." delay={300}>
          <DonutChart
            centerLabel="device"
            segments={[
              { label: 'Online', value: deviceOnline ?? 0, color: CHART_COLORS.online },
              { label: 'Offline', value: (totalDevice ?? 0) - (deviceOnline ?? 0), color: CHART_COLORS.offline },
            ]}
          />
        </ChartCard>

        <ChartCard title="Komposisi konten" description="Jumlah konten menurut tipenya." delay={360}>
          <BarList
            emptyText="Belum ada konten."
            items={
              types && totalKonten
                ? [
                    { label: 'Teks', value: types.text, color: CHART_COLORS.brandDark },
                    { label: 'Gambar', value: types.image, color: CHART_COLORS.brandLight },
                    { label: 'Video', value: types.video, color: CHART_COLORS.amber },
                    { label: 'Tautan', value: types.url, color: CHART_COLORS.neutral },
                  ]
                : []
            }
          />
        </ChartCard>

        <ChartCard
          title="Konten baru"
          description={`Jumlah konten yang ditambahkan dalam ${CHART_DAYS} hari terakhir.`}
          delay={420}
          className="lg:col-span-2"
        >
          <ColumnChart data={perDay} unit="konten" />
        </ChartCard>

        <ChartCard title="Item playlist per device" description="Banyaknya konten di playlist tiap device." delay={480}>
          <BarList emptyText="Belum ada playlist yang bisa ditampilkan." items={playlistBars} />
        </ChartCard>

        <ChartCard title="Status device" description="Daftar device dan statusnya." delay={540}>
          {devices?.length === 0 && <p className="text-sm text-slate-500">Belum ada device. Tambah di menu Device.</p>}
          {devices && devices.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {devices.slice(0, MAX_LISTED_DEVICES).map((device) => (
                <li key={device.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{device.nama}</p>
                    <p className="truncate text-xs text-slate-500">{device.lokasi}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={device.status} />
                    <Link to={`/devices/${device.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                      Kelola
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {devices && devices.length > 0 && (
            <Link to="/devices" className="mt-4 inline-block text-sm text-brand-700 hover:underline">
              Lihat semua device
            </Link>
          )}
        </ChartCard>
      </div>
    </section>
  )
}
