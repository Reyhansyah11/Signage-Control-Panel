import { useState } from 'react'
import { Modal } from '../components/Modal'
import { ContentForm } from '../features/contents/ContentForm'
import { ContentPreview } from '../features/contents/ContentPreview'
import { useContents } from '../features/contents/useContents'
import type { ContentSubmit } from '../features/contents/useContents'
import type { Content, ContentType } from '../types/api'

const TYPE_LABEL: Record<ContentType, string> = {
  text: 'Teks',
  image: 'Gambar',
  video: 'Video',
  url: 'Tautan',
}

const FILTERS: { value: ContentType | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'text', label: 'Teks' },
  { value: 'image', label: 'Gambar' },
  { value: 'video', label: 'Video' },
  { value: 'url', label: 'Tautan' },
]

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('id-ID', { dateStyle: 'medium' })
}

export default function ContentsPage() {
  const { contents, error, createContent, updateContent, deleteContent } = useContents()
  // 'new' = form tambah, Content = form ubah, null = tertutup.
  const [editing, setEditing] = useState<Content | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Content | null>(null)
  const [filter, setFilter] = useState<ContentType | 'all'>('all')
  const [actionError, setActionError] = useState<string | null>(null)

  const visible = contents?.filter((content) => filter === 'all' || content.tipe === filter)

  async function handleSave(value: ContentSubmit): Promise<void> {
    if (editing === 'new') {
      await createContent(value)
    } else if (editing && value.kind === 'json') {
      await updateContent(editing.id, { judul: value.judul, payload: value.payload })
    }
    setEditing(null)
  }

  async function handleDelete(): Promise<void> {
    if (!deleting) return
    try {
      await deleteContent(deleting.id)
      setActionError(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal menghapus konten.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Konten</h1>
          <p className="mt-1 text-sm text-slate-500">Teks, tautan, gambar, dan video yang bisa ditampilkan di device.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Tambah konten
        </button>
      </div>

      {(error ?? actionError) && (
        <p role="alert" className="mt-6 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error ?? actionError}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Saring berdasarkan jenis">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              filter === item.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {contents === null && !error && <p className="text-sm text-slate-500">Memuat konten...</p>}

        {contents && visible?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-medium">{contents.length === 0 ? 'Belum ada konten' : 'Tidak ada konten dengan jenis ini'}</p>
            {contents.length === 0 && (
              <p className="mt-1 text-sm text-slate-500">Tambah teks, tautan, atau upload gambar dan video.</p>
            )}
          </div>
        )}

        {visible && visible.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((content) => (
              <li key={content.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="aspect-video overflow-hidden bg-slate-100">
                  <ContentPreview content={content} />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{content.judul}</p>
                    <p className="text-xs text-slate-500">
                      {TYPE_LABEL[content.tipe]}, ditambahkan {formatDate(content.createdAt)}
                    </p>
                  </div>
                  <div className="mt-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(content)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(content)}
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
        title={editing === 'new' ? 'Tambah konten' : 'Ubah konten'}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <ContentForm
            content={editing === 'new' ? null : editing}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal open={deleting !== null} title="Hapus konten?" onClose={() => setDeleting(null)}>
        <p className="text-sm text-slate-600">
          Konten <span className="font-medium text-slate-900">{deleting?.judul}</span> akan dihapus permanen. File
          yang diunggah ikut dihapus dari storage.
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
            Hapus konten
          </button>
        </div>
      </Modal>
    </section>
  )
}
