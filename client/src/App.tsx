import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { API_URL } from './lib/config'

type Status = 'menunggu' | 'ok' | 'gagal'

interface Check {
  status: Status
  detail: string
}

const MENUNGGU: Check = { status: 'menunggu', detail: 'Memeriksa...' }

const BADGE: Record<Status, string> = {
  menunggu: 'bg-slate-200 text-slate-700',
  ok: 'bg-emerald-100 text-emerald-800',
  gagal: 'bg-rose-100 text-rose-800',
}

function CheckRow({ label, check }: { label: string; check: Check }) {
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-slate-500">{check.detail}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${BADGE[check.status]}`}>
        {check.status}
      </span>
    </li>
  )
}

export default function App() {
  const [rest, setRest] = useState<Check>(MENUNGGU)
  const [ws, setWs] = useState<Check>(MENUNGGU)

  useEffect(() => {
    // Tanpa token, endpoint admin harus menjawab 401: artinya server hidup dan auth aktif.
    fetch(`${API_URL}/api/auth/me`)
      .then((res) =>
        setRest(
          res.status === 401
            ? { status: 'ok', detail: 'Server terhubung, auth aktif (401 tanpa token)' }
            : { status: 'gagal', detail: `Status tak terduga: ${res.status}` },
        ),
      )
      .catch(() =>
        setRest({ status: 'gagal', detail: 'Server tidak terjangkau. Pastikan backend jalan di port 3000.' }),
      )

    // Koneksi tanpa role admin diperlakukan sebagai device, jadi lolos tanpa JWT.
    const socket = io(API_URL || window.location.origin, { reconnection: false, timeout: 4000 })
    socket.on('connect', () => setWs({ status: 'ok', detail: `Terhubung, socket id ${socket.id}` }))
    socket.on('connect_error', (err) => setWs({ status: 'gagal', detail: err.message }))
    return () => {
      socket.close()
    }
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Signage Control Panel</h1>
        <p className="mt-1 text-sm text-slate-500">Cek setup frontend. Halaman ini akan diganti login dan dashboard.</p>
        <ul className="mt-6 divide-y divide-slate-100">
          <CheckRow label="REST API (proxy /api)" check={rest} />
          <CheckRow label="WebSocket (proxy /socket.io)" check={ws} />
        </ul>
      </div>
    </main>
  )
}
