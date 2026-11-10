import fs from 'node:fs'
import path from 'node:path'

/** Konfigurasi yang diisi teknisi sekali saat memasang pemutar di komputer layar. */
export interface DeviceConfig {
  /** Alamat aplikasi web panel (origin saja), contohnya http://localhost:5173. */
  appUrl: string
  /** UUID device yang sudah didaftarkan admin di dashboard. */
  deviceId: string
  /** Jalankan pemutar otomatis saat komputer dinyalakan (hanya berlaku di aplikasi terpasang). */
  autoStart: boolean
}

export type ValidationResult = { ok: true; config: DeviceConfig } | { ok: false; error: string }

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Memeriksa isian setup. Dipakai untuk input form maupun file konfigurasi yang dibaca dari disk. */
export function validateConfig(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'Konfigurasi tidak valid.' }
  }
  const { appUrl, deviceId, autoStart } = input as Record<string, unknown>

  if (typeof appUrl !== 'string' || appUrl.trim() === '') {
    return { ok: false, error: 'Alamat aplikasi wajib diisi.' }
  }
  let origin: string
  try {
    const parsed = new URL(appUrl.trim())
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('protokol')
    origin = parsed.origin
  } catch {
    return { ok: false, error: 'Alamat aplikasi harus berupa URL http:// atau https://, misalnya http://localhost:5173.' }
  }

  if (typeof deviceId !== 'string' || !UUID_PATTERN.test(deviceId.trim())) {
    return { ok: false, error: 'ID device harus berupa UUID, salin dari halaman detail device di dashboard.' }
  }

  return {
    ok: true,
    config: { appUrl: origin, deviceId: deviceId.trim().toLowerCase(), autoStart: autoStart === true },
  }
}

/** Alamat halaman pemutar yang dibuka jendela aplikasi. */
export function playerUrl(config: DeviceConfig): string {
  return `${config.appUrl}/device/${config.deviceId}`
}

/** Penyimpanan konfigurasi di satu file JSON. File rusak diperlakukan sebagai belum dikonfigurasi. */
export class ConfigStore {
  private readonly filePath: string

  constructor(filePath: string) {
    this.filePath = filePath
  }

  read(): DeviceConfig | null {
    try {
      const result = validateConfig(JSON.parse(fs.readFileSync(this.filePath, 'utf8')))
      return result.ok ? result.config : null
    } catch {
      return null
    }
  }

  write(config: DeviceConfig): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true })
    // Tulis ke file sementara lalu ganti nama, supaya listrik mati di tengah jalan tidak merusak file.
    const temporary = `${this.filePath}.tmp`
    fs.writeFileSync(temporary, JSON.stringify(config, null, 2))
    fs.renameSync(temporary, this.filePath)
  }

  clear(): void {
    fs.rmSync(this.filePath, { force: true })
  }
}
