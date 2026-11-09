import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DurationInput, MAX_DURATION, MIN_DURATION } from '../features/devices/DurationInput'
import { StatusBadge } from '../features/devices/StatusBadge'
import { DEFAULT_DURATION, usePlaylist } from '../features/devices/usePlaylist'
import { useDevices } from '../features/devices/useDevices'
import { useContents } from '../features/contents/useContents'
import { formatLastSeen } from '../lib/format'
import type { Content, ContentType } from '../types/api'

const TYPE_LABEL: Record<ContentType, string> = {
  text: 'Teks',
  image: 'Gambar',
  video: 'Video',
  url: 'Tautan',
}

const iconButton =
  'rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40'

interface PushResult {
  ok: boolean
  text: string
}

export default function DeviceDetailPage() {
  const { deviceId = '' } = useParams()
  const { devices, error: devicesError, connected } = useDevices()
  const { contents, error: contentsError } = useContents()
  const playlist = usePlaylist(deviceId)

  const [pushDuration, setPushDuration] = useState(DEFAULT_DURATION)
  const [pushing, setPushing] = useState<string | null>(null)
  const [pushResult, setPushResult] = useState<PushResult | null>(null)

  const device = devices?.find((item) => item.id === deviceId)
  const online = device?.status === 'online'
  const inPlaylist = new Set(playlist.entries?.map((entry) => entry.contentId))
  const loadError = devicesError ?? contentsError

  async function handlePush(content: Content): Promise<void> {
    setPushing(content.id)
    setPushResult(null)
    try {
      await playlist.pushContent(content.id, pushDuration)
      setPushResult({ ok: true, text: `"${content.judul}" dikirim ke ${device?.nama ?? 'device'}.` })
    } catch (err) {
      setPushResult({ ok: false, text: err instanceof Error ? err.message : 'Gagal mengirim konten.' })
    } finally {
      setPushing(null)
    }
  }

  if (devices !== null && !device) {
    return (
      <section>
        <Link to="/devices" className="text-sm text-indigo-600 hover:underline">
          Kembali ke daftar device
        </Link>
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium">Device tidak ditemukan</p>
          <p className="mt-1 text-sm text-slate-500">Device ini mungkin sudah dihapus.</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <Link to="/devices" className="text-sm text-indigo-600 hover:underline">
        Kembali ke daftar device
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{device?.nama ?? 'Memuat...'}</h1>
          <p className="mt-1 text-sm text-slate-500">{device?.lokasi}</p>
        </div>
        {device && (
          <div className="text-right" aria-live="polite">
            <StatusBadge status={device.status} />
            <p className="mt-1 text-xs text-slate-400">
              {connected ? `Terakhir aktif: ${formatLastSeen(device.lastSeen)}` : 'Menyambungkan...'}
            </p>
          </div>
        )}
      </div>

      {loadError && (
        <p role="alert" className="mt-6 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {loadError}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Playlist</h2>
            <button
              type="button"
              onClick={() => void playlist.save()}
              disabled={!playlist.dirty || playlist.saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {playlist.saving ? 'Menyimpan...' : 'Simpan playlist'}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500" aria-live="polite">
            {playlist.entries === null
              ? 'Memuat playlist...'
              : playlist.dirty
                ? 'Ada perubahan yang belum disimpan.'
                : 'Semua perubahan tersimpan. Device online langsung menerima playlist terbaru.'}
          </p>

          {playlist.error && (
            <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {playlist.error}
            </p>
          )}

          {playlist.entries?.length === 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center">
              <p className="font-medium">Playlist masih kosong</p>
              <p className="mt-1 text-sm text-slate-500">Tambah konten dari perpustakaan di samping.</p>
            </div>
          )}

          {playlist.entries && playlist.entries.length > 0 && (
            <ol className="mt-4 divide-y divide-slate-100">
              {playlist.entries.map((entry, index) => (
                <li key={entry.key} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-6 text-sm font-medium text-slate-400">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{entry.judul}</p>
                    <p className="text-xs text-slate-500">{TYPE_LABEL[entry.tipe]}</p>
                  </div>
                  <DurationInput
                    value={entry.durasiDetik}
                    onChange={(value) => playlist.setDuration(entry.key, value)}
                    label={`Durasi ${entry.judul}`}
                    disabled={playlist.saving}
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label={`Naikkan ${entry.judul}`}
                      onClick={() => playlist.moveEntry(entry.key, -1)}
                      disabled={index === 0 || playlist.saving}
                      className={iconButton}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Turunkan ${entry.judul}`}
                      onClick={() => playlist.moveEntry(entry.key, 1)}
                      disabled={index === (playlist.entries?.length ?? 0) - 1 || playlist.saving}
                      className={iconButton}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => playlist.removeEntry(entry.key)}
                      disabled={playlist.saving}
                      className={`${iconButton} border-rose-200 text-rose-700 hover:bg-rose-50`}
                    >
                      Keluarkan
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Perpustakaan konten</h2>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Durasi push
              <input
                type="number"
                min={MIN_DURATION}
                max={MAX_DURATION}
                value={pushDuration}
                onChange={(event) => {
                  const parsed = Number(event.target.value)
                  if (Number.isInteger(parsed) && parsed >= MIN_DURATION && parsed <= MAX_DURATION) {
                    setPushDuration(parsed)
                  }
                }}
                className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-right text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
              detik
            </label>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {online
              ? 'Push menampilkan konten di device sekarang juga tanpa mengubah playlist.'
              : 'Device offline, push tidak bisa dikirim. Playlist tetap bisa diatur.'}
          </p>

          {pushResult && (
            <p
              role={pushResult.ok ? 'status' : 'alert'}
              className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                pushResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {pushResult.text}
            </p>
          )}

          {contents === null && !contentsError && <p className="mt-4 text-sm text-slate-500">Memuat konten...</p>}

          {contents?.length === 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center">
              <p className="font-medium">Belum ada konten</p>
              <Link to="/contents" className="mt-1 inline-block text-sm text-indigo-600 hover:underline">
                Tambah konten di menu Konten
              </Link>
            </div>
          )}

          {contents && contents.length > 0 && (
            <ul className="mt-4 divide-y divide-slate-100">
              {contents.map((content) => {
                const added = inPlaylist.has(content.id)
                return (
                  <li key={content.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{content.judul}</p>
                      <p className="text-xs text-slate-500">{TYPE_LABEL[content.tipe]}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => playlist.addContent(content)}
                        disabled={added || playlist.entries === null || playlist.saving}
                        className={iconButton}
                      >
                        {added ? 'Sudah di playlist' : 'Tambah'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handlePush(content)}
                        disabled={!online || pushing !== null}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {pushing === content.id ? 'Mengirim...' : 'Push'}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
