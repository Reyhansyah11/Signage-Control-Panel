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
