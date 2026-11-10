import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { Spinner } from '../components/Spinner'
import { useAuth } from '../features/auth/useAuth'
import { ApiError } from '../lib/api'

interface LocationState {
  from?: string
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status === 401 ? 'Username atau password salah.' : error.message
  }
  return 'Terjadi kesalahan tak terduga. Coba lagi.'
}

const INPUT_CLASS =
  'mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-2 focus:outline-offset-0 focus:outline-brand-500/30 disabled:bg-slate-100'

export default function LoginPage() {
  const { token, login } = useAuth()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from ?? '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (token) return <Navigate to={from} replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username.trim(), password)
      // Berhasil: token terisi, halaman ini mengarahkan sendiri lewat <Navigate> di atas.
    } catch (err) {
      setError(toMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark className="size-12" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Signage Control Panel</h1>
          <p className="mt-1 text-sm text-slate-500">Masuk untuk mengelola device dan konten.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoFocus
              required
              disabled={submitting}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={submitting}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting && <Spinner />}
            {submitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </main>
  )
}
