// Menguji handshake WebSocket: admin wajib JWT, device tidak.
// Pakai: TOKEN=<jwt admin> node scripts/ws-auth-test.mjs
import { io } from 'socket.io-client';

const URL = process.env.SERVER_URL ?? 'http://localhost:3000';
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error('Set TOKEN terlebih dahulu (hasil login admin).');
  process.exit(1);
}

function tryConnect(auth) {
  return new Promise((resolve) => {
    const socket = io(URL, { auth, reconnection: false, timeout: 4000 });
    const finish = (result) => {
      socket.close();
      resolve(result);
    };
    socket.on('connect', () => finish({ connected: true }));
    socket.on('connect_error', (err) => finish({ connected: false, reason: err.message }));
  });
}

const cases = [
  { name: 'admin tanpa token ditolak', auth: { role: 'admin' }, expectConnected: false },
  { name: 'admin dengan token palsu ditolak', auth: { role: 'admin', token: 'bukan.token.valid' }, expectConnected: false },
  { name: 'admin dengan token valid diterima', auth: { role: 'admin', token: TOKEN }, expectConnected: true },
  { name: 'device (tanpa role admin) tetap bisa konek', auth: {}, expectConnected: true },
];

let failed = 0;
for (const testCase of cases) {
  const result = await tryConnect(testCase.auth);
  const pass = result.connected === testCase.expectConnected;
  if (!pass) failed += 1;
  console.log(`${pass ? 'LOLOS' : 'GAGAL'}  ${testCase.name}${result.reason ? `  (${result.reason})` : ''}`);
}
process.exit(failed === 0 ? 0 : 1);
