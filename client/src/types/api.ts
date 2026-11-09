export type DeviceStatus = 'online' | 'offline'
export type ContentType = 'text' | 'image' | 'video' | 'url'

export interface Device {
  id: string
  nama: string
  lokasi: string
  status: DeviceStatus
  lastSeen: string | null
}

export interface Content {
  id: string
  judul: string
  tipe: ContentType
  payload: string
  createdAt: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
}
