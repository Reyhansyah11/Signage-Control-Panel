const KEY = 'signage.token'

// Semua akses dibungkus try/catch: storage bisa tidak tersedia (mode privat, kebijakan browser).
export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(KEY, token)
  } catch {
    // Token tetap hidup di memori selama tab terbuka.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Tidak ada yang perlu dibersihkan.
  }
}
