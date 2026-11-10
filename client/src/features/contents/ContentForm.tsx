import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { Content } from '../../types/api'
import type { ContentSubmit } from './useContents'

type Mode = 'text' | 'link' | 'file'
type LinkType = 'url' | 'image' | 'video'

interface ContentFormProps {
  /** Null saat menambah konten baru; saat mengubah, hanya judul dan isi yang bisa diganti. */
  content: Content | null
  onSubmit: (input: ContentSubmit) => Promise<void>
  onCancel: () => void
}

const MAX_FILE_BYTES = 50 * 1024 * 1024

const MODES: { value: Mode; label: string }[] = [
  { value: 'text', label: 'Teks' },
  { value: 'link', label: 'Tautan' },
  { value: 'file', label: 'Upload file' },
]

const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: 'url', label: 'Halaman web' },
  { value: 'image', label: 'Gambar' },
  { value: 'video', label: 'Video' },
]

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:bg-slate-50'

export function ContentForm({ content, onSubmit, onCancel }: ContentFormProps) {
  const editing = content !== null
  const [mode, setMode] = useState<Mode>('text')
  const [linkType, setLinkType] = useState<LinkType>('url')
  const [judul, setJudul] = useState(content?.judul ?? '')
  const [payload, setPayload] = useState(content?.payload ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Saat mengubah, bentuk isian mengikuti tipe konten yang ada.
  const showTextarea = editing ? content.tipe === 'text' : mode === 'text'
  const showFile = !editing && mode === 'file'

  function handleFile(event: ChangeEvent<HTMLInputElement>): void {
    const picked = event.target.files?.[0] ?? null
    setFile(picked)
    // Judul diisi otomatis dari nama file, selama belum diisi manual.
    if (picked && !judul.trim()) setJudul(picked.name.replace(/\.[^.]+$/, ''))
  }

  function buildSubmit(): ContentSubmit | string {
    const title = judul.trim()
    if (showFile) {
      if (!file) return 'Pilih file gambar atau video terlebih dahulu.'
      if (file.size > MAX_FILE_BYTES) return 'Ukuran file maksimal 50 MB.'
      return { kind: 'upload', judul: title, file }
    }
    const tipe = editing ? content.tipe : mode === 'text' ? 'text' : linkType
    return { kind: 'json', judul: title, tipe, payload: showTextarea ? payload : payload.trim() }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const built = buildSubmit()
    if (typeof built === 'string') {
      setError(built)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit(built)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan konten.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      {!editing && (
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Jenis konten">
          {MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={mode === item.value}
              disabled={saving}
              onClick={() => {
                setMode(item.value)
                setError(null)
              }}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                mode === item.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <label className="block text-sm font-medium text-slate-700">
        Judul
        <input
          className={inputClass}
          value={judul}
          onChange={(event) => setJudul(event.target.value)}
          maxLength={150}
          required
          disabled={saving}
          placeholder="Promo akhir tahun"
        />
      </label>

      {!editing && mode === 'link' && (
        <label className="block text-sm font-medium text-slate-700">
          Jenis tautan
          <select
            className={inputClass}
            value={linkType}
            onChange={(event) => setLinkType(event.target.value as LinkType)}
            disabled={saving}
          >
            {LINK_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {showFile ? (
        <label className="block text-sm font-medium text-slate-700">
          File gambar atau video (maks. 50 MB)
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFile}
            required
            disabled={saving}
            className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />
        </label>
      ) : showTextarea ? (
        <label className="block text-sm font-medium text-slate-700">
          Isi teks
          <textarea
            className={`${inputClass} min-h-28 resize-y`}
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            required
            disabled={saving}
            placeholder="Diskon 50% semua menu!"
          />
        </label>
      ) : (
        <label className="block text-sm font-medium text-slate-700">
          Alamat tautan
          <input
            type="url"
            className={inputClass}
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            required
            disabled={saving}
            placeholder="https://example.com"
          />
        </label>
      )}

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
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? (showFile ? 'Mengunggah...' : 'Menyimpan...') : editing ? 'Simpan' : 'Tambah konten'}
        </button>
      </div>
    </form>
  )
}
