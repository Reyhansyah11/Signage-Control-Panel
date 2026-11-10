import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { BrandMark } from './BrandMark'

const NAV_ITEMS = [
  { to: '/', label: 'Ringkasan', end: true },
  { to: '/devices', label: 'Device', end: false },
  { to: '/contents', label: 'Konten', end: false },
]

export function AppLayout() {
  const { username, logout } = useAuth()
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 bg-brand-900 text-white shadow-md shadow-brand-950/20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <BrandMark className="size-9" />
              <span className="hidden font-semibold tracking-tight sm:inline">Signage Control Panel</span>
            </div>
            <nav className="flex items-center gap-1" aria-label="Menu utama">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive ? 'bg-white/15 text-white' : 'text-brand-100/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-brand-100/80 sm:inline">{username}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* key = alamat halaman, sehingga animasi masuk berulang setiap pindah halaman. */}
        <div key={pathname} className="animate-fade-up">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
