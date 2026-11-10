import type { Content } from '../../types/api'

/** Tampilan layar penuh satu konten. Teks dirender sebagai teks biasa, bukan HTML. */
export function ContentScreen({ content }: { content: Content }) {
  switch (content.tipe) {
    case 'text':
      return (
        <div className="flex size-full items-center justify-center bg-linear-to-br from-indigo-950 via-slate-900 to-slate-950 p-10 sm:p-16">
          <p className="max-w-5xl text-center text-4xl leading-tight font-bold whitespace-pre-line sm:text-6xl">
            {content.payload}
          </p>
        </div>
      )
    case 'image':
      return <img src={content.payload} alt={content.judul} className="size-full bg-black object-contain" />
    case 'video':
      // Video harus muted agar browser mengizinkan autoplay.
      return (
        <video
          src={content.payload}
          autoPlay
          muted
          loop
          playsInline
          className="size-full bg-black object-contain"
        />
      )
    case 'url':
      return (
        <iframe
          src={content.payload}
          title={content.judul}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="no-referrer"
          className="size-full border-0 bg-white"
        />
      )
  }
}
