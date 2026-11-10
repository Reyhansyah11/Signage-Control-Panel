#!/usr/bin/env bash
# Membuat aplikasi desktop Electron (desktop/): pemutar device yang dipasang di komputer layar.
# Jalankan dari root repo (folder yang berisi server/ dan client/):  bash setup-desktop.sh
set -euo pipefail

if [ ! -d client ] || [ ! -d server ]; then
  echo "Folder client/ dan server/ tidak ditemukan. Jalankan skrip ini dari root repo." >&2
  exit 1
fi
if [ -e desktop ]; then
  echo "Folder desktop/ sudah ada, tidak ditimpa. Hapus dulu kalau ingin mengulang." >&2
  exit 1
fi

mkdir -p desktop/src desktop/renderer
cd desktop

# ------------------------------------------------------------------ package.json
cat > package.json <<'EOF'
{
  "name": "signage-device-player",
  "version": "0.1.0",
  "private": true,
  "description": "Aplikasi desktop pemutar device untuk Signage Control Panel",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "start": "npm run build && electron .",
    "start:windowed": "npm run build && electron . --windowed",
    "test": "npm run build && node --test dist/config.test.js"
  }
}
EOF

# ------------------------------------------------------------------ tsconfig.json
cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "node16",
    "moduleResolution": "node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["node"]
  },
  "include": ["src"]
}
EOF

# ------------------------------------------------------------------ .gitignore
cat > .gitignore <<'EOF'
node_modules
dist
EOF

# ------------------------------------------------------------------ src/config.ts
cat > src/config.ts <<'EOF'
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
EOF

# ------------------------------------------------------------------ src/config.test.ts
cat > src/config.test.ts <<'EOF'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { ConfigStore, playerUrl, validateConfig } from './config'

const ID = '95de274d-f1ce-48eb-ab81-9a18382eb36b'

describe('validateConfig', () => {
  it('menerima isian yang benar dan merapikannya', () => {
    const result = validateConfig({ appUrl: ' http://localhost:5173/devices?x=1 ', deviceId: ID.toUpperCase(), autoStart: true })
    assert.deepEqual(result, { ok: true, config: { appUrl: 'http://localhost:5173', deviceId: ID, autoStart: true } })
  })

  it('autoStart bernilai false kalau tidak diisi', () => {
    const result = validateConfig({ appUrl: 'https://signage.example.com', deviceId: ID })
    assert.equal(result.ok && result.config.autoStart, false)
  })

  it('menolak alamat kosong, bukan URL, atau bukan http/https', () => {
    for (const appUrl of ['', '   ', 'localhost:5173', 'ftp://server', 'javascript:alert(1)', 'file:///etc/passwd']) {
      assert.equal(validateConfig({ appUrl, deviceId: ID }).ok, false, appUrl)
    }
  })

  it('menolak ID device yang bukan UUID', () => {
    for (const deviceId of ['', 'abc', ID.slice(1), `${ID}x`, undefined, 42]) {
      assert.equal(validateConfig({ appUrl: 'http://localhost:5173', deviceId }).ok, false, String(deviceId))
    }
  })

  it('menolak input yang bukan objek', () => {
    for (const input of [null, undefined, 'x', 7]) assert.equal(validateConfig(input).ok, false)
  })
})

describe('playerUrl', () => {
  it('menyusun alamat halaman pemutar', () => {
    assert.equal(
      playerUrl({ appUrl: 'http://localhost:5173', deviceId: ID, autoStart: false }),
      `http://localhost:5173/device/${ID}`,
    )
  })
})

describe('ConfigStore', () => {
  const tempFile = (): string => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'signage-')), 'nested', 'device-config.json')
  const config = { appUrl: 'http://localhost:5173', deviceId: ID, autoStart: false }

  it('belum dikonfigurasi saat file belum ada', () => {
    assert.equal(new ConfigStore(tempFile()).read(), null)
  })

  it('menyimpan lalu membaca kembali, termasuk membuat folder yang belum ada', () => {
    const store = new ConfigStore(tempFile())
    store.write(config)
    assert.deepEqual(store.read(), config)
  })

  it('menganggap file rusak atau tidak valid sebagai belum dikonfigurasi', () => {
    const file = tempFile()
    const store = new ConfigStore(file)
    store.write(config)
    fs.writeFileSync(file, '{rusak')
    assert.equal(store.read(), null)
    fs.writeFileSync(file, JSON.stringify({ appUrl: 'bukan-url', deviceId: ID }))
    assert.equal(store.read(), null)
  })

  it('clear menghapus konfigurasi dan aman dipanggil dua kali', () => {
    const store = new ConfigStore(tempFile())
    store.write(config)
    store.clear()
    store.clear()
    assert.equal(store.read(), null)
  })
})
EOF

# ------------------------------------------------------------------ src/preload.ts
cat > src/preload.ts <<'EOF'
import { contextBridge, ipcRenderer } from 'electron'

// Jembatan ini hanya dipasang di halaman setup lokal (file://). Halaman pemutar yang dimuat
// dari server tidak mendapat akses apa pun ke pengaturan aplikasi.
if (window.location.protocol === 'file:') {
  contextBridge.exposeInMainWorld('signageSetup', {
    getConfig: (): Promise<unknown> => ipcRenderer.invoke('config:get'),
    save: (input: unknown): Promise<unknown> => ipcRenderer.invoke('config:save', input),
    cancel: (): Promise<void> => ipcRenderer.invoke('config:cancel'),
  })
}
EOF

# ------------------------------------------------------------------ src/main.ts
cat > src/main.ts <<'EOF'
import path from 'node:path'
import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import type { IpcMainInvokeEvent } from 'electron'
import { ConfigStore, playerUrl, validateConfig } from './config'
import type { DeviceConfig } from './config'

const RENDERER_DIR = path.join(__dirname, '..', 'renderer')
const ERR_ABORTED = -3
const WINDOWED = process.argv.includes('--windowed')

let store: ConfigStore
let win: BrowserWindow | null = null

/** Halaman setup hanya boleh diakses dari file lokal, bukan dari halaman pemutar di server. */
function isSetupPage(event: IpcMainInvokeEvent): boolean {
  const url = event.senderFrame?.url ?? ''
  return url.startsWith('file://') && url.includes('setup.html')
}

function createWindow(): BrowserWindow {
  const created = new BrowserWindow({
    title: 'Signage Device Player',
    fullscreen: !WINDOWED,
    width: 1280,
    height: 720,
    backgroundColor: '#020617',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Pemutar menayangkan video tanpa interaksi pengguna.
      autoplayPolicy: 'no-user-gesture-required',
    },
  })

  // Konten tautan tampil di dalam bingkai pemutar; jendela baru tidak boleh dibuka.
  created.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // Server atau jaringan belum siap: tampilkan halaman tunggu yang mencoba lagi sendiri.
  created.webContents.on('did-fail-load', (_event, errorCode, _description, validatedUrl, isMainFrame) => {
    if (!isMainFrame || errorCode === ERR_ABORTED || !validatedUrl.startsWith('http')) return
    void created.loadFile(path.join(RENDERER_DIR, 'retry.html'), { query: { target: validatedUrl } })
  })

  created.on('closed', () => {
    win = null
  })
  return created
}

function showSetup(): void {
  void win?.loadFile(path.join(RENDERER_DIR, 'setup.html'))
}

function showPlayer(config: DeviceConfig): void {
  void win?.loadURL(playerUrl(config))
}

/** Membuka pemutar bila sudah dikonfigurasi, selain itu layar setup. */
function launch(): void {
  const config = store.read()
  if (config) showPlayer(config)
  else showSetup()
}

function applyAutoStart(config: DeviceConfig): void {
  // Hanya untuk aplikasi yang sudah dipaketkan; saat pengembangan ini akan mendaftarkan binary Electron mentah.
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: config.autoStart })
}

function registerIpc(): void {
  ipcMain.handle('config:get', (event) => (isSetupPage(event) ? store.read() : null))

  ipcMain.handle('config:save', (event, input: unknown) => {
    if (!isSetupPage(event)) return { ok: false, error: 'Tidak diizinkan.' }
    const result = validateConfig(input)
    if (!result.ok) return result
    store.write(result.config)
    applyAutoStart(result.config)
    showPlayer(result.config)
    return { ok: true }
  })

  ipcMain.handle('config:cancel', (event) => {
    if (!isSetupPage(event)) return
    const config = store.read()
    if (config) showPlayer(config)
  })
}

function buildMenu(): void {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'Device',
        submenu: [
          { label: 'Pengaturan device', accelerator: 'CmdOrCtrl+Shift+S', click: showSetup },
          { label: 'Muat ulang', accelerator: 'CmdOrCtrl+R', click: launch },
          { label: 'Layar penuh', accelerator: 'F11', click: () => win?.setFullScreen(!win.isFullScreen()) },
          { type: 'separator' },
          { label: 'Keluar', accelerator: 'CmdOrCtrl+Q', role: 'quit' },
        ],
      },
    ]),
  )
}

// Satu komputer hanya menjalankan satu pemutar; membuka lagi memfokuskan jendela yang ada.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win?.isMinimized()) win.restore()
    win?.focus()
  })

  void app.whenReady().then(() => {
    store = new ConfigStore(path.join(app.getPath('userData'), 'device-config.json'))
    registerIpc()
    buildMenu()
    win = createWindow()
    launch()
  })

  app.on('window-all-closed', () => app.quit())
}
EOF

# ------------------------------------------------------------------ renderer/styles.css
cat > renderer/styles.css <<'EOF'
:root { color-scheme: dark; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #020617; color: #f8fafc; }
main { width: min(32rem, 92vw); padding: 2rem; }
h1 { margin: 0 0 .25rem; font-size: 1.5rem; }
p.lead { margin: 0 0 1.5rem; color: #94a3b8; font-size: .9rem; }
label { display: block; margin-bottom: 1rem; font-size: .85rem; font-weight: 600; color: #cbd5e1; }
input[type='text'] { display: block; width: 100%; margin-top: .35rem; padding: .6rem .75rem; border: 1px solid #334155; border-radius: .5rem; background: #0f172a; color: inherit; font: inherit; }
input[type='text']:focus { outline: 2px solid #6366f1; border-color: #6366f1; }
.hint { display: block; margin-top: .25rem; font-weight: 400; color: #64748b; }
.check { display: flex; align-items: center; gap: .5rem; font-weight: 500; }
.error { margin: 0 0 1rem; padding: .6rem .75rem; border-radius: .5rem; background: #4c0519; color: #fecdd3; font-size: .85rem; }
.actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1.5rem; }
button { padding: .6rem 1rem; border: 1px solid #334155; border-radius: .5rem; background: transparent; color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
button.primary { border-color: #4f46e5; background: #4f46e5; }
button:disabled { opacity: .6; cursor: wait; }
.center { text-align: center; }
EOF

# ------------------------------------------------------------------ renderer/setup.html
cat > renderer/setup.html <<'EOF'
<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'" />
    <title>Pengaturan device</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main>
      <h1>Pengaturan device</h1>
      <p class="lead">Diisi sekali saat memasang pemutar. Pengaturan tersimpan di komputer ini.</p>
      <form id="form" novalidate>
        <p id="error" class="error" role="alert" hidden></p>
        <label>
          Alamat aplikasi panel
          <input id="appUrl" type="text" value="http://localhost:5173" autocomplete="off" required />
          <span class="hint">Alamat tempat aplikasi web dijalankan.</span>
        </label>
        <label>
          ID device
          <input id="deviceId" type="text" placeholder="95de274d-f1ce-48eb-ab81-9a18382eb36b" autocomplete="off" spellcheck="false" required />
          <span class="hint">Salin dari halaman detail device di dashboard.</span>
        </label>
        <label class="check">
          <input id="autoStart" type="checkbox" />
          Jalankan otomatis saat komputer menyala
        </label>
        <div class="actions">
          <button id="cancel" type="button" hidden>Batal</button>
          <button id="submit" type="submit" class="primary">Simpan dan mulai</button>
        </div>
      </form>
    </main>
    <script src="setup.js"></script>
  </body>
</html>
EOF

# ------------------------------------------------------------------ renderer/setup.js
cat > renderer/setup.js <<'EOF'
const form = document.getElementById('form')
const appUrl = document.getElementById('appUrl')
const deviceId = document.getElementById('deviceId')
const autoStart = document.getElementById('autoStart')
const errorBox = document.getElementById('error')
const cancel = document.getElementById('cancel')
const submit = document.getElementById('submit')

function showError(message) {
  errorBox.textContent = message
  errorBox.hidden = false
}

// Bila sudah pernah dikonfigurasi, isian terisi dan tombol Batal tersedia.
void window.signageSetup.getConfig().then((config) => {
  if (!config) return
  appUrl.value = config.appUrl
  deviceId.value = config.deviceId
  autoStart.checked = config.autoStart
  cancel.hidden = false
})

cancel.addEventListener('click', () => void window.signageSetup.cancel())

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  errorBox.hidden = true
  submit.disabled = true
  const result = await window.signageSetup.save({
    appUrl: appUrl.value,
    deviceId: deviceId.value,
    autoStart: autoStart.checked,
  })
  // Bila berhasil, jendela langsung berpindah ke halaman pemutar.
  if (!result.ok) {
    showError(result.error)
    submit.disabled = false
  }
})
EOF

# ------------------------------------------------------------------ renderer/retry.html
cat > renderer/retry.html <<'EOF'
<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'" />
    <title>Menunggu server</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="center">
      <h1>Menunggu server</h1>
      <p class="lead">Tidak bisa terhubung ke <span id="host"></span>. Mencoba lagi otomatis setiap 5 detik.</p>
      <p class="lead">Tekan Ctrl+Shift+S untuk mengubah pengaturan device.</p>
    </main>
    <script src="retry.js"></script>
  </body>
</html>
EOF

# ------------------------------------------------------------------ renderer/retry.js
cat > renderer/retry.js <<'EOF'
const RETRY_MS = 5000
const target = new URLSearchParams(window.location.search).get('target') ?? ''

// Hanya mencoba lagi ke alamat http/https, bukan alamat sembarang dari parameter.
if (/^https?:\/\//.test(target)) {
  document.getElementById('host').textContent = new URL(target).host
  setTimeout(() => window.location.replace(target), RETRY_MS)
}
EOF

# ------------------------------------------------------------------ pasang dependensi
echo "Memasang dependensi (electron cukup besar, mohon tunggu)..."
npm install --save-dev electron typescript @types/node

# Beberapa konfigurasi npm memblokir skrip install, dan binary Electron diunduh oleh skrip itu.
# Bila binary belum ada, unduh sekarang.
if [ ! -f node_modules/electron/path.txt ]; then
  echo "Mengunduh binary Electron..."
  node node_modules/electron/install.js
fi

echo "Menjalankan build dan tes..."
npm test

cd ..
echo
echo "Selesai. Jalankan pemutar:"
echo "  cd desktop && npm start            # layar penuh"
echo "  cd desktop && npm run start:windowed   # berjendela, untuk pengujian"
