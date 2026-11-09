export interface JwtClaims {
  sub: string
  exp: number
}

/** Membaca isi token di sisi client. Hanya untuk tampilan dan cek kedaluwarsa; server tetap yang memverifikasi tanda tangan. */
export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(atob(payload)) as Partial<JwtClaims>
    if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number') return null
    return { sub: claims.sub, exp: claims.exp }
  } catch {
    return null
  }
}

export function msUntilExpiry(claims: JwtClaims): number {
  return claims.exp * 1000 - Date.now()
}
