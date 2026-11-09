import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiFetch, setUnauthorizedHandler } from '../../lib/api'
import { decodeJwt, msUntilExpiry } from '../../lib/jwt'
import { clearToken, getToken, setToken } from '../../lib/token-storage'
import type { LoginResponse } from '../../types/api'
import { AuthContext, type AuthContextValue } from './auth-context'

/** Token yang tersimpan hanya dipakai kalau masih valid; yang kedaluwarsa dibuang. */
function readStoredToken(): string | null {
  const stored = getToken()
  if (!stored) return null
  const claims = decodeJwt(stored)
  if (!claims || msUntilExpiry(claims) <= 0) {
    clearToken()
    return null
  }
  return stored
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(readStoredToken)

  const logout = useCallback(() => {
    clearToken()
    setTokenState(null)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const response = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { username, password },
      public: true,
    })
    setToken(response.accessToken)
    setTokenState(response.accessToken)
  }, [])

  // Server menjawab 401 (token tidak berlaku lagi): keluar otomatis.
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  // Keluar otomatis tepat saat token kedaluwarsa.
  useEffect(() => {
    if (!token) return
    const claims = decodeJwt(token)
    if (!claims) return
    const timer = setTimeout(logout, Math.max(msUntilExpiry(claims), 0))
    return () => clearTimeout(timer)
  }, [token, logout])

  const username = useMemo(() => (token ? (decodeJwt(token)?.sub ?? null) : null), [token])
  const value = useMemo<AuthContextValue>(
    () => ({ token, username, login, logout }),
    [token, username, login, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
