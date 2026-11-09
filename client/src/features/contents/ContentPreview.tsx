import type { Content } from '../../types/api'

function hostOf(value: string): string {
  try {
    return new URL(value).host
  } catch {
    return value
  }
}

/** Pratinjau isi konten sesuai tipenya. Teks dirender sebagai teks biasa, bukan HTML. */
export function ContentPreview({ content }: { content: Content }) {
  switch (content.tipe) {
    case 'image':
      return <img src={content.payload} alt={content.judul} loading="lazy" className="size-full object-cover" />
    case 'video':
      return <video src={content.payload} preload="metadata" controls muted className="size-full object-cover" />
    case 'url':
      return (
        <div className="flex size-full flex-col items-center justify-center gap-1 p-4 text-center">
          <span className="max-w-full truncate text-sm font-medium text-slate-700">{hostOf(content.payload)}</span>
          <a
            href={content.payload}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-600 hover:underline"
          >
            Buka tautan
          </a>
        </div>
      )
    case 'text':
      return <p className="line-clamp-5 p-4 text-sm whitespace-pre-line text-slate-700">{content.payload}</p>
  }
}
