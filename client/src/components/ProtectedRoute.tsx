import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'

/** Semua route di dalamnya wajib login; kalau belum, diarahkan ke /login dan kembali setelahnya. */
export function ProtectedRoute() {
  const { token } = useAuth()
  const location = useLocation()

  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
