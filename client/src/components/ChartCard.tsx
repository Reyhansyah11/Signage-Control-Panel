import type { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  description?: string
  /** Jeda animasi masuk dalam milidetik, supaya kartu muncul bergantian. */
  delay?: number
  className?: string
  children: ReactNode
}

/** Kartu putih standar untuk grafik dan daftar di dashboard. */
export function ChartCard({ title, description, delay = 0, className = '', children }: ChartCardProps) {
  return (
    <section
      className={`animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}
