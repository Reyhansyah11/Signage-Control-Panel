const RETRY_MS = 5000
const target = new URLSearchParams(window.location.search).get('target') ?? ''

// Hanya mencoba lagi ke alamat http/https, bukan alamat sembarang dari parameter.
if (/^https?:\/\//.test(target)) {
  document.getElementById('host').textContent = new URL(target).host
  setTimeout(() => window.location.replace(target), RETRY_MS)
}
