import type { DeviceStatus } from '../../types/api'

/** Penanda status device. Teks selalu ada, jadi artinya tidak bergantung pada warna; titik online berdenyut. */
export function StatusBadge({ status }: { status: DeviceStatus }) {
  const online = status === 'online'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        online ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      <span className="relative flex size-2">
        {online && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
        <span className={`relative inline-flex size-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      </span>
      {online ? 'Online' : 'Offline'}
    </span>
  )
}
