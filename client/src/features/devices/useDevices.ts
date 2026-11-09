import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { createAdminSocket } from '../../lib/socket'
import type { Device, DeviceStatus } from '../../types/api'

export interface DeviceInput {
  nama: string
  lokasi: string
}

/** Payload event `device:status` dari server (lihat docs/realtime.md). */
interface DeviceStatusEvent {
  deviceId: string
  status: DeviceStatus
  lastSeen: string | null
}

const byName = (a: Device, b: Device): number => a.nama.localeCompare(b.nama, 'id')

/**
 * Daftar device untuk dashboard: data awal dari REST, status online/offline
 * diperbarui langsung lewat WebSocket tanpa refresh.
 */
export function useDevices() {
  const [devices, setDevices] = useState<Device[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let cancelled = false
    let hasConnected = false

    const load = (): void => {
      apiFetch<Device[]>('/devices')
        .then((list) => {
          if (cancelled) return
          setDevices(list)
          setError(null)
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat device.')
        })
    }

    load()
    const socket = createAdminSocket()

    socket.on('connect', () => {
      setConnected(true)
      // Setelah reconnect, event yang terlewat diganti dengan data terbaru dari REST.
      if (hasConnected) load()
      hasConnected = true
    })
    socket.on('disconnect', () => setConnected(false))
    socket.on('device:status', (event: DeviceStatusEvent) => {
      setDevices((current) =>
        current
          ? current.map((device) =>
              device.id === event.deviceId
                ? { ...device, status: event.status, lastSeen: event.lastSeen }
                : device,
            )
          : current,
      )
    })

    return () => {
      cancelled = true
      socket.disconnect()
    }
  }, [])

  const createDevice = useCallback(async (input: DeviceInput): Promise<void> => {
    const created = await apiFetch<Device>('/devices', { method: 'POST', body: input })
    setDevices((current) => [...(current ?? []), created].sort(byName))
  }, [])

  const updateDevice = useCallback(async (id: string, input: DeviceInput): Promise<void> => {
    const updated = await apiFetch<Device>(`/devices/${id}`, { method: 'PATCH', body: input })
    setDevices((current) =>
      current ? current.map((device) => (device.id === id ? updated : device)).sort(byName) : current,
    )
  }, [])

  const deleteDevice = useCallback(async (id: string): Promise<void> => {
    await apiFetch<void>(`/devices/${id}`, { method: 'DELETE' })
    setDevices((current) => (current ? current.filter((device) => device.id !== id) : current))
  }, [])

  return { devices, error, connected, createDevice, updateDevice, deleteDevice }
}
