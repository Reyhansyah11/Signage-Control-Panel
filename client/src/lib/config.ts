/** Base URL backend. Kosong berarti satu origin (lewat proxy Vite saat dev). */
export const API_URL: string = import.meta.env.VITE_API_URL ?? ''
