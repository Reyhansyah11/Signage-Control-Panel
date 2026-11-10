import { useMounted } from '../../lib/useMounted'
import type { DayCount } from '../../lib/stats'
import { CHART_COLORS } from './colors'

interface ColumnChartProps {
  data: DayCount[]
  /** Satuan untuk tooltip, contohnya "konten". */
  unit: string
}

/** Grafik kolom per hari; kolom tumbuh dari bawah saat dimuat. Hari tanpa data tampil sebagai garis tipis. */
export function ColumnChart({ data, unit }: ColumnChartProps) {
  const mounted = useMounted()
  const max = Math.max(...data.map((day) => day.count), 1)
  const summary = data.map((day) => `${day.title}: ${day.count} ${unit}`).join(', ')

  return (
    <div role="img" aria-label={summary}>
      <div className="flex h-40 items-end gap-1.5">
        {data.map((day, index) => (
          <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${day.title}: ${day.count} ${unit}`}>
            {day.count > 0 && <span className="text-[10px] font-medium text-slate-500">{day.count}</span>}
            <div
              className="w-full rounded-t-md transition-[height] duration-700 ease-out"
              style={{
                height: mounted ? `${day.count === 0 ? 2 : Math.max((day.count / max) * 100, 6)}%` : '0%',
                backgroundColor: day.count === 0 ? '#e2e8f0' : CHART_COLORS.brand,
                transitionDelay: `${index * 40}ms`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {data.map((day) => (
          <span key={day.key} className="flex-1 text-center text-[10px] text-slate-400">
            {day.label}
          </span>
        ))}
      </div>
    </div>
  )
}
