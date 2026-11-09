export function formatLastSeen(value: string | null): string {
  if (!value) return 'Belum pernah terhubung'
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}
