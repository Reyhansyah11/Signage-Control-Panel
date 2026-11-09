import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Device } from '../../types/api'
import type { DeviceInput } from './useDevices'

interface DeviceFormProps {
  /** Null saat menambah device baru. */
  device: Device | null
  onSubmit: (input: DeviceInput) => Promise<void>
  onCancel: () => void
}

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-50'

/** Form tambah/ubah device. Menutup dirinya lewat parent saat onSubmit berhasil. */
export function DeviceForm({ device, onSubmit, onCancel }: DeviceFormProps) {
  const [nama, setNama] = useState(device?.nama ?? '')
  const [lokasi, setLokasi] = useState(device?.lokasi ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSubmit({ nama: nama.trim(), lokasi: lokasi.trim() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan device.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      <label className="block text-sm font-medium text-slate-700">
        Nama device
        <input
          className={inputClass}
          value={nama}
          onChange={(event) => setNama(event.target.value)}
          maxLength={100}
          required
          disabled={saving}
          placeholder="Layar Lobi"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Lokasi
        <input
          className={inputClass}
          value={lokasi}
          onChange={(event) => setLokasi(event.target.value)}
          maxLength={100}
          required
          disabled={saving}
          placeholder="Lobi Lt.1"
        />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  )
}
