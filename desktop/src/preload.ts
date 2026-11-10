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
