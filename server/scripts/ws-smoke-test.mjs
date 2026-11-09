// Simulasi singkat: satu admin dan satu device. Admin harus melihat
// device:status "online" saat device register, lalu "offline" saat device putus.
//
// Pakai:  DEVICE_ID=<uuid device> node scripts/ws-smoke-test.mjs
import { io } from 'socket.io-client';

const url = process.env.WS_URL ?? 'http://localhost:3000';
const deviceId = process.env.DEVICE_ID;

if (!deviceId) {
  console.error('Set DEVICE_ID terlebih dahulu.');
  process.exit(1);
}

const admin = io(url, { auth: { role: 'admin', token: process.env.ADMIN_TOKEN } });
admin.on('device:status', (payload) => console.log('[admin] device:status', payload));
admin.on('connect', () => {
  console.log('[admin] terhubung');
  setTimeout(connectDevice, 500);
});

function connectDevice() {
  const device = io(url);
  device.on('connect', () => {
    device.emit('device:register', { deviceId }, (ack) => {
      console.log('[device] ack', ack);
      setTimeout(() => {
        console.log('[device] memutus koneksi');
        device.disconnect();
      }, 3000);
      setTimeout(() => {
        admin.disconnect();
        process.exit(0);
      }, 5000);
    });
  });
}
