// Simulasi device yang mendengarkan: mendaftar, lalu mencetak playlist dan
// command push yang diterima. Register dipanggil di setiap `connect`, jadi
// reconnect otomatis (mis. server di-restart) langsung mendaftarkan ulang device.
//
// Pakai:  DEVICE_ID=<uuid device> node scripts/ws-device-listener.mjs
import { io } from 'socket.io-client';

const url = process.env.WS_URL ?? 'http://localhost:3000';
const deviceId = process.env.DEVICE_ID;

if (!deviceId) {
  console.error('Set DEVICE_ID terlebih dahulu.');
  process.exit(1);
}

const socket = io(url);

socket.on('connect', () => {
  console.log('[device] terhubung, mendaftar...');
  socket.emit('device:register', { deviceId }, (ack) => console.log('[device] ack', ack));
});

socket.on('playlist:updated', ({ items }) => {
  console.log(`[device] playlist:updated, ${items.length} item:`);
  for (const item of items) {
    console.log(`  ${item.urutan + 1}. ${item.content.judul} (${item.content.tipe}, ${item.durasiDetik} dtk)`);
  }
});

socket.on('content:push', ({ content, durasiDetik }) => {
  console.log(`[device] content:push -> ${content.judul} (${content.tipe}), durasi: ${durasiDetik ?? 'sampai command berikutnya'}`);
});

socket.on('disconnect', (reason) => console.log('[device] terputus:', reason));
console.log('Mendengarkan... tekan Ctrl+C untuk berhenti.');
