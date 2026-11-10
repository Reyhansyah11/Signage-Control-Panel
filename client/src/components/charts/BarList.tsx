import { useMounted } from '../../lib/useMounted'
import { CHART_COLORS } from './colors'

export interface BarItem {
  label: string
  value: number
  /** Warna batang; bawaannya hijau merek. */
  color?: string
}

interface BarListProps {
  items: BarItem[]
  emptyText: string
}

/** Daftar batang horizontal; lebar batang dibandingkan dengan nilai terbesar dan tumbuh bergantian saat dimuat. */
export function BarList({ items, emptyText }: BarListProps) {
  const mounted = useMounted()
  const max = Math.max(...items.map((item) => item.value), 1)

  if (items.length === 0) return <p className="text-sm text-slate-500">{emptyText}</p>

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-slate-600">{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: mounted ? `${(item.value / max) * 100}%` : '0%',
                backgroundColor: item.color ?? CHART_COLORS.brand,
                transitionDelay: `${index * 80}ms`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
