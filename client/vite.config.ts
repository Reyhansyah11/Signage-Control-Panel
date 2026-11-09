import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Backend NestJS. Saat dev, /api dan /socket.io diteruskan ke sini
// sehingga browser hanya bicara ke satu origin (tanpa masalah CORS).
const BACKEND_URL = process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': BACKEND_URL,
      '/socket.io': { target: BACKEND_URL, ws: true },
    },
  },
})
