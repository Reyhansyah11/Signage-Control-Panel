import { API_URL } from './config'
import { getToken } from './token-storage'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Objek biasa dikirim sebagai JSON; FormData dikirim sebagai multipart. */
  body?: unknown
  /** Route tanpa JWT (contohnya login): token tidak dikirim dan 401 tidak memicu logout. */
  public?: boolean
}

const UNREACHABLE_MESSAGE = 'Server tidak terjangkau. Pastikan backend berjalan.'

/** Status yang dikirim proxy atau gateway saat backend tidak bisa dihubungi. */
const GATEWAY_STATUSES: ReadonlySet<number> = new Set([502, 503, 504])

let unauthorizedHandler: (() => void) | null = null

/** Dipanggil setiap server menjawab 401 untuk route yang butuh login (token kedaluwarsa atau dicabut). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string | string[] }
    if (Array.isArray(data.message)) return data.message.join(', ')
    if (data.message) return data.message
  } catch {
    // Body bukan JSON; pakai teks status.
  }
  return response.statusText || `Permintaan gagal (${response.status})`
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined
  return body instanceof FormData ? body : JSON.stringify(body)
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, public: isPublic = false } = options

  const headers: Record<string, string> = {}
  if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token && !isPublic) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: serializeBody(body),
    })
  } catch {
    throw new ApiError(0, UNREACHABLE_MESSAGE)
  }

  if (!response.ok) {
    if (GATEWAY_STATUSES.has(response.status)) {
      throw new ApiError(response.status, UNREACHABLE_MESSAGE)
    }
    if (response.status === 401 && !isPublic) unauthorizedHandler?.()
    throw new ApiError(response.status, await readErrorMessage(response))
  }

  // Beberapa endpoint (contohnya push, 202) tidak punya body.
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}
