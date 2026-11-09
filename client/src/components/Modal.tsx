import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Dialog modal berbasis elemen <dialog> bawaan browser: fokus terkunci di dalam
 * dialog dan tombol Esc menutupnya. Isinya hanya dirender saat terbuka, sehingga
 * state form selalu mulai bersih.
 */
export function Modal({ open, title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        // Klik pada backdrop (bukan isi dialog) menutup dialog.
        if (event.target === ref.current) onClose()
      }}
      className="m-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/40"
    >
      {open && (
        <div className="p-6">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <div className="mt-4">{children}</div>
        </div>
      )}
    </dialog>
  )
}
