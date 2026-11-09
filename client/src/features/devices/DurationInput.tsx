import { useState } from 'react'

export const MIN_DURATION = 1
export const MAX_DURATION = 3600

interface DurationInputProps {
  value: number
  onChange: (value: number) => void
  label: string
  disabled?: boolean
}

/**
 * Input durasi dalam detik. Teks yang sedang diketik boleh sementara tidak valid (misalnya
 * kosong); nilai baru hanya diteruskan bila bilangan bulat dalam rentang, dan saat fokus
 * hilang tampilan kembali ke nilai terakhir yang sah.
 */
export function DurationInput({ value, onChange, label, disabled = false }: DurationInputProps) {
  const [text, setText] = useState<string | null>(null)

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="sr-only">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={MIN_DURATION}
        max={MAX_DURATION}
        step={1}
        value={text ?? String(value)}
        disabled={disabled}
        onChange={(event) => {
          setText(event.target.value)
          const parsed = Number(event.target.value)
          if (Number.isInteger(parsed) && parsed >= MIN_DURATION && parsed <= MAX_DURATION) onChange(parsed)
        }}
        onBlur={() => setText(null)}
        className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-right text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-50"
      />
      <span aria-hidden="true">detik</span>
    </label>
  )
}
