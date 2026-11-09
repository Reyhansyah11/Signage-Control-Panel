import { useState } from 'react'
import { Modal } from '../components/Modal'
import { DeviceForm } from '../features/devices/DeviceForm'
import { useDevices } from '../features/devices/useDevices'
import type { DeviceInput } from '../features/devices/useDevices'
import type { Device, DeviceStatus } from '../types/api'

function formatLastSeen(value: string | null): string {
  if (!value) return 'Belum pernah terhubung'
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

function StatusBadge({ status }: { status: DeviceStatus }) {
  const online = status === 'online'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        online ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      <span className={`size-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {online ? 'Online' : 'Offline'}
    </span>
  )
}

export default function DevicesPage() {
  const { devices, error, connected, createDevice, updateDevice, deleteDevice } = useDevices()
  // 'new' = form tambah, Device = form ubah, null = tertutup.
  const [editing, setEditing] = useState<Device | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Device | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleSave(input: DeviceInput): Promise<void> {
    if (editing === 'new') await createDevice(input)
    else if (editing) await updateDevice(editing.id, input)
    setEditing(null)
  }

  async function handleDelete(): Promise<void> {
    if (!deleting) return
    try {
      await deleteDevice(deleting.id)
      setActionError(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal menghapus device.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Device</h1>
          <p className="mt-1 text-sm text-slate-500">
            Layar yang terhubung ke panel. Status berubah otomatis tanpa refresh.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500" aria-live="polite">
            <span className={`size-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {connected ? 'Real-time aktif' : 'Menyambungkan...'}
          </span>
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Tambah device
          </button>
        </div>
      </div>

      {(error ?? actionError) && (
        <p role="alert" className="mt-6 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error ?? actionError}
        </p>
      )}

      <div className="mt-6">
        {devices === null && !error && <p className="text-sm text-slate-500">Memuat device...</p>}

        {devices?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-medium">Belum ada device</p>
            <p className="mt-1 text-sm text-slate-500">
              Tambah device pertama, lalu hubungkan dari halaman device client.
            </p>
          </div>
        )}

        {devices && devices.length > 0 && (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {devices.map((device) => (
              <li key={device.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{device.nama}</p>
                  <p className="truncate text-sm text-slate-500">{device.lokasi}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <StatusBadge status={device.status} />
                    <p className="mt-1 text-xs text-slate-400">
                      Terakhir aktif: {formatLastSeen(device.lastSeen)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(device)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(device)}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Tambah device' : 'Ubah device'}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <DeviceForm
            device={editing === 'new' ? null : editing}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal open={deleting !== null} title="Hapus device?" onClose={() => setDeleting(null)}>
        <p className="text-sm text-slate-600">
          Device <span className="font-medium text-slate-900">{deleting?.nama}</span> dan playlist-nya akan
          dihapus permanen.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleting(null)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Hapus device
          </button>
        </div>
      </Modal>
    </section>
  )
}
