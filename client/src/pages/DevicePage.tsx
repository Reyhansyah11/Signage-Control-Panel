import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ContentScreen } from '../features/devices/ContentScreen'
import { useDevicePlayer } from '../features/devices/useDevicePlayer'
import type { PlayerStatus } from '../features/devices/useDevicePlayer'

const STATUS_LABEL: Record<PlayerStatus, string> = {
  connecting: 'Menghubungkan...',
  online: 'Terhubung',
  offline: 'Terputus, mencoba menyambung ulang...',
}

const STATUS_DOT: Record<PlayerStatus, string> = {
  connecting: 'bg-amber-400',
  online: 'bg-emerald-400',
  offline: 'bg-rose-400',
}

/** Layar device (publik, tanpa login): memutar playlist dan menampilkan konten push. */
export default function DevicePage() {
  const { deviceId = '' } = useParams()
  const { status, registerError, items, pushed, clearPushed } = useDevicePlayer(deviceId)
  const [index, setIndex] = useState(0)

  // Konten push dengan durasi hilang sendiri; tanpa durasi ia tampil sampai perintah berikutnya.
  useEffect(() => {
    if (!pushed || pushed.durasiDetik === null) return undefined
    const { id, durasiDetik } = pushed
    const timer = window.setTimeout(() => clearPushed(id), durasiDetik * 1000)
    return () => window.clearTimeout(timer)
  }, [pushed, clearPushed])

  // Playlist berputar: pindah ke item berikutnya setelah durasi item sekarang habis.
  // Selama ada konten push, putaran dijeda dan dilanjutkan setelah push selesai.
  useEffect(() => {
    if (pushed || items.length === 0) return undefined
    const item = items[index % items.length]
    if (!item) return undefined
    const timer = window.setTimeout(() => setIndex((value) => value + 1), item.durasiDetik * 1000)
    return () => window.clearTimeout(timer)
  }, [index, items, pushed])

  const current = items.length > 0 ? items[index % items.length] : undefined
  const shown = pushed?.content ?? current?.content
  const shownKey = pushed ? `push-${pushed.id}` : `slide-${index % Math.max(items.length, 1)}-${current?.content.id}`

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-slate-950 text-white">
      {registerError ? (
        <div className="flex size-full flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-2xl font-semibold">Device tidak bisa terdaftar</p>
          <p role="alert" className="max-w-xl text-slate-300">
            {registerError}
          </p>
        </div>
      ) : shown ? (
        <div key={shownKey} className="size-full">
          <ContentScreen content={shown} />
        </div>
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 text-center">
          <p className="text-3xl font-semibold">Menunggu konten</p>
          <p className="text-slate-400">Device {deviceId.slice(0, 8)}, playlist masih kosong.</p>
        </div>
      )}

      <div className="absolute top-4 right-4 flex items-center gap-3">
        <span
          className="inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs"
          aria-live="polite"
        >
          <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} />
          {STATUS_LABEL[status]}
        </span>
        <button
          type="button"
          onClick={() => void document.documentElement.requestFullscreen().catch(() => undefined)}
          className="rounded-full bg-black/50 px-3 py-1 text-xs hover:bg-black/70"
        >
          Layar penuh
        </button>
      </div>
    </main>
  )
}
