import { io } from 'socket.io-client'
import type { ManagerOptions, Socket, SocketOptions } from 'socket.io-client'
import { API_URL } from './config'
import { getToken } from './token-storage'

/**
 * Membuat koneksi Socket.IO sebagai admin. Token dibaca ulang setiap kali
 * (re)connect, jadi login ulang tidak membuat koneksi lama memakai token basi.
 */
export function createAdminSocket(): Socket {
  const options: Partial<ManagerOptions & SocketOptions> = {
    auth: (callback) => callback({ role: 'admin', token: getToken() ?? '' }),
  }
  // Tanpa API_URL, socket memakai origin halaman (diteruskan proxy Vite saat dev).
  return API_URL ? io(API_URL, options) : io(options)
}

/**
 * Membuat koneksi Socket.IO sebagai device. Device tidak memakai JWT: ia hanya mendaftar
 * dengan deviceId lewat event `device:register` setelah tersambung.
 */
export function createDeviceSocket(): Socket {
  return API_URL ? io(API_URL) : io()
}
