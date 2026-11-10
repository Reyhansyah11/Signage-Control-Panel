import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { createDeviceSocket } from '../../lib/socket'
import type { Content } from '../../types/api'

export type PlayerStatus = 'connecting' | 'online' | 'offline'

export interface PlayerItem {
  urutan: number
  durasiDetik: number
  content: Content
}

/** Konten hasil perintah push. `durasiDetik` null berarti tampil sampai perintah berikutnya. */
export interface PushedContent {
  id: number
  content: Content
  durasiDetik: number | null
}

/** Balasan `device:register` (lihat server/src/realtime/realtime.events.ts). */
type RegisterAck = { ok: true; deviceId: string } | { ok: false; error: string }

const REGISTER_TIMEOUT_MS = 5000
const RECONNECT_DELAY_MS = 1000

const sortItems = (items: PlayerItem[]): PlayerItem[] => [...items].sort((a, b) => a.urutan - b.urutan)

/**
 * Sisi device: mendaftar ke server, mengambil playlist, dan mengikuti event realtime.
 * Setiap connect (termasuk reconnect setelah server restart) mendaftar ulang dan mengambil
 * ulang playlist, sedangkan layar tetap memutar playlist terakhir selama koneksi putus.
 */
export function useDevicePlayer(deviceId: string) {
  const [status, setStatus] = useState<PlayerStatus>('connecting')
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [items, setItems] = useState<PlayerItem[]>([])
  const [pushed, setPushed] = useState<PushedContent | null>(null)

  useEffect(() => {
    let cancelled = false
    // Naik setiap event playlist:updated; hasil GET yang lebih tua dari event itu dibuang.
    let updateSeq = 0
    let pushSeq = 0
    let reconnectTimer: number | undefined

    const loadPlaylist = (): void => {
      const seqAtStart = updateSeq
      // Route publik: token admin (kalau ada di browser ini) tidak boleh ikut terkirim.
      apiFetch<PlayerItem[]>(`/devices/${deviceId}/playlist`, { public: true })
        .then((list) => {
          if (!cancelled && seqAtStart === updateSeq) setItems(sortItems(list))
        })
        .catch(() => {
          // Gagal memuat: layar tetap memutar playlist terakhir yang diketahui.
        })
    }

    const socket = createDeviceSocket()

    socket.on('connect', () => {
      socket
        .timeout(REGISTER_TIMEOUT_MS)
        .emit('device:register', { deviceId }, (error: Error | null, ack?: RegisterAck) => {
          if (cancelled) return
          if (error || !ack) {
            setRegisterError('Server tidak membalas pendaftaran. Periksa ID device pada alamat halaman.')
            return
          }
          if (!ack.ok) {
            setRegisterError(ack.error)
            return
          }
          setRegisterError(null)
          setStatus('online')
          loadPlaylist()
        })
    })
    socket.on('disconnect', (reason: string) => {
      setStatus('offline')
      // Putus karena server sengaja menutup koneksi: untuk alasan ini Socket.IO tidak
      // menyambung ulang sendiri, jadi device menyambung manual setelah jeda singkat.
      if (reason === 'io server disconnect') {
        reconnectTimer = window.setTimeout(() => socket.connect(), RECONNECT_DELAY_MS)
      }
    })
    socket.on('connect_error', () => setStatus('offline'))

    socket.on('playlist:updated', ({ items: next }: { items: PlayerItem[] }) => {
      updateSeq += 1
      setItems(sortItems(next))
      // Playlist baru menggantikan konten push yang tidak punya batas waktu.
      setPushed((current) => (current && current.durasiDetik === null ? null : current))
    })

    socket.on('content:push', ({ content, durasiDetik }: { content: Content; durasiDetik?: number | null }) => {
      pushSeq += 1
      setPushed({ id: pushSeq, content, durasiDetik: durasiDetik ?? null })
    })

    return () => {
      cancelled = true
      window.clearTimeout(reconnectTimer)
      socket.disconnect()
    }
  }, [deviceId])

  const clearPushed = useCallback((id: number): void => {
    setPushed((current) => (current?.id === id ? null : current))
  }, [])

  return { status, registerError, items, pushed, clearPushed }
}
