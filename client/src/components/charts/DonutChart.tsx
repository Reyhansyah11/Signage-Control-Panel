import { useMounted } from '../../lib/useMounted'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  /** Keterangan di bawah angka total di tengah cincin. */
  centerLabel: string
}

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Grafik cincin berbasis SVG: tiap segmen tumbuh dari nol saat dimuat, dengan legenda di sampingnya. */
export function DonutChart({ segments, centerLabel }: DonutChartProps) {
  const mounted = useMounted()
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)

  const lengths = segments.map((segment) =>
    total === 0 ? 0 : (segment.value / total) * CIRCUMFERENCE,
  )
  const arcs = segments.map((segment, index) => ({
    ...segment,
    length: lengths[index],
    offset: lengths.slice(0, index).reduce((sum, value) => sum + value, 0),
  }))

  const summary = segments.map((segment) => `${segment.label} ${segment.value}`).join(', ')

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative size-36 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={summary}>
          <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="12" className="stroke-slate-100" />
          {arcs.map(
            (arc) =>
              arc.length > 0 && (
                <circle
                  key={arc.label}
                  cx="50"
                  cy="50"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="12"
                  stroke={arc.color}
                  strokeDasharray={`${mounted ? arc.length : 0} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-arc.offset}
                  style={{ transition: 'stroke-dasharray 900ms ease-out' }}
                />
              ),
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight">{total}</span>
          <span className="text-xs text-slate-500">{centerLabel}</span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
              {segment.label}
            </span>
            <span className="font-medium">
              {segment.value}
              <span className="ml-1.5 text-xs font-normal text-slate-400">
                {total === 0 ? '0%' : `${Math.round((segment.value / total) * 100)}%`}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
