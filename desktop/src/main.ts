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
