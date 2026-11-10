# Signage Control Panel

Aplikasi untuk mengelola perangkat digital signage, mengatur konten yang ditampilkan, dan memantau koneksi perangkat secara real-time.

Repository ini terdiri dari tiga aplikasi:

| Folder | Teknologi | Fungsi |
|---|---|---|
| `server/` | NestJS, Prisma, Socket.IO | REST API, autentikasi admin, database, upload file, dan komunikasi real-time |
| `client/` | React, Vite, TypeScript, Tailwind CSS | Dashboard admin dan halaman pemutar konten untuk device |
| `desktop/` | Electron, TypeScript | Aplikasi desktop yang membuka halaman pemutar device dalam jendela khusus/fullscreen |

## Fitur

- Login admin menggunakan JWT.
- CRUD device: membuat, melihat, mengubah, dan menghapus device.
- CRUD konten: teks, URL, gambar, dan video.
- Upload gambar/video ke Supabase Storage.
- Status device `online`/`offline` berdasarkan koneksi Socket.IO dan informasi waktu terakhir terlihat.
- Playlist berbeda untuk setiap device, dengan pengaturan urutan dan durasi tampil.
- Perubahan playlist dikirim ke device secara real-time.
- Push konten ke device yang sedang online tanpa mengubah playlist.
- Halaman pemutar publik di `/device/:deviceId`; halaman ini tidak memerlukan login admin.
- Aplikasi desktop Electron dengan pengaturan alamat aplikasi dan UUID device.

## Arsitektur singkat

```text
                    ┌─────────────────────────┐
                    │       Admin Browser     │
                    │   React + Vite (client)  │
                    └────────────┬────────────┘
                                 │ REST API + Socket.IO
                                 ▼
                    ┌─────────────────────────┐
                    │      NestJS Server      │
                    │   REST + WebSocket      │
                    └───────┬─────────┬───────┘
                            │         │
                   Prisma   │         │ Supabase Storage SDK
                            ▼         ▼
                  ┌──────────────┐  ┌─────────────────┐
                  │ Supabase DB  │  │ Supabase Storage│
                  │ PostgreSQL   │  │  bucket contents│
                  └──────────────┘  └─────────────────┘

                    Socket.IO / HTTP
                            │
                            ▼
                  ┌────────────────────┐
                  │ Device Player      │
                  │ Browser / Electron │
                  └────────────────────┘
```

- Dashboard admin menggunakan REST API dan Socket.IO.
- Device membuka halaman frontend `/device/<UUID>` dan mendaftar melalui event Socket.IO `device:register`.
- Device mengambil playlist melalui `GET /api/devices/:deviceId/playlist`. Endpoint baca playlist ini memang dikecualikan dari JWT agar device tidak memerlukan akun admin.
- Koneksi device yang terputus akan mengubah status ke offline; saat tersambung dan berhasil mendaftar, status menjadi online.
- Electron hanya menjadi pembungkus desktop untuk halaman pemutar yang sama. Logika playlist dan playback tetap berada di frontend.

## Persyaratan

Siapkan perangkat development dengan:

- Node.js dan npm yang kompatibel dengan versi dependency pada masing-masing `package.json`.
- Akun/proyek Supabase.
- Git (jika melakukan clone repository).

Gunakan terminal pada root repository untuk menjalankan perintah. Setiap aplikasi memiliki `package.json` sendiri, sehingga dependency dipasang secara terpisah di masing-masing folder.

## 1. Menyiapkan Supabase

### 1.1 Buat project

1. Buat project baru di [Supabase](https://supabase.com/).
2. Tunggu sampai database project selesai dibuat.
3. Buka bagian **Project Settings → Database** untuk mengambil connection string PostgreSQL.
4. Buka bagian **Project Settings → API** untuk mengambil Project URL dan `service_role` key.

### 1.2 Siapkan connection string database

Backend menggunakan dua URL database yang berbeda:

| Environment variable | Kegunaan |
|---|---|
| `DATABASE_URL` | Koneksi aplikasi melalui Supabase transaction pooler (umumnya port `6543`) |
| `DIRECT_URL` | Koneksi langsung/session pooler untuk operasi Prisma migration (umumnya port `5432`) |

Salin connection string yang sesuai dari halaman Database Supabase. Jika menggunakan pooler, pilih mode yang sesuai dengan kegunaan masing-masing variabel. Pastikan password database pada URL sudah benar dan karakter khusus di dalam password di-URL-encode.

### 1.3 Buat Storage bucket

1. Buka **Storage** di dashboard Supabase.
2. Buat bucket bernama `contents`.
3. Atur bucket menjadi **Public**.

Bucket perlu public karena backend menyimpan public URL file sebagai nilai `payload`, lalu frontend menampilkan file melalui URL tersebut. Nama bucket dapat diganti melalui `SUPABASE_BUCKET`, tetapi bucket dengan nama yang sama harus tersedia di project Supabase.

> `SUPABASE_SERVICE_ROLE_KEY` adalah secret server-side. Jangan pernah memasukkannya ke environment frontend, mengirimkannya ke browser, atau melakukan commit file `.env` ke Git.

## 2. Menjalankan backend (NestJS)

Masuk ke folder server:

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` dan isi nilai berikut:

```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# HTTP server
PORT=3000

# Supabase Storage
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-secret>"
SUPABASE_BUCKET="contents"

# Admin dashboard authentication
JWT_SECRET="ganti-dengan-secret-acak-yang-panjang"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="ganti-dengan-password-kuat"

# Opsional: masa berlaku JWT dalam detik (default 28800 / 8 jam)
# JWT_EXPIRES_IN_SECONDS=28800
```

Catatan:

- `SUPABASE_URL` adalah Project URL dari Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` adalah key rahasia dari Supabase API settings, bukan anon/public key.
- `ADMIN_USERNAME` dan `ADMIN_PASSWORD` menjadi kredensial login dashboard. Password tidak dibuat otomatis oleh aplikasi; tentukan sendiri melalui environment variable.
- `JWT_SECRET` harus berupa secret acak yang kuat dan tidak boleh dibagikan.
- `SUPABASE_BUCKET` opsional; jika tidak diisi, backend menggunakan `contents`.

### 2.1 Buat tabel database

Migration awal tersedia di `server/prisma/migrations/`. Jalankan:

```bash
npx prisma generate
npx prisma migrate deploy
```

Perintah tersebut membuat Prisma Client dan menerapkan migration yang sudah ada ke database Supabase. Jangan menjalankan `prisma migrate dev` pada database production.

Tabel yang dibuat oleh migration:

- `devices`
- `contents`
- `playlist_items`

Enum database:

- `DeviceStatus`: `online`, `offline`
- `ContentType`: `image`, `video`, `text`, `url`

### 2.2 Jalankan backend

Mode development dengan hot reload:

```bash
npm run start:dev
```

Mode biasa:

```bash
npm run start
```

Build dan jalankan hasil build:

```bash
npm run build
npm run start:prod
```

Secara default backend berjalan di:

```text
http://localhost:3000
```

Dokumentasi Swagger tersedia di:

```text
http://localhost:3000/api/docs
```

## 3. Menjalankan frontend (React + Vite)

Buka terminal baru dari root repository:

```bash
cd client
npm install
cp .env.example .env
```

Untuk development lokal, konfigurasi default dapat digunakan:

```env
# Kosong: request menggunakan proxy Vite
VITE_API_URL=

# Alamat backend NestJS
VITE_PROXY_TARGET=http://localhost:3000
```

`VITE_PROXY_TARGET` digunakan oleh Vite untuk meneruskan request `/api` dan koneksi WebSocket `/socket.io` ke backend. Pastikan backend sudah berjalan.

Jalankan frontend:

```bash
npm run dev
```

Frontend tersedia di:

```text
http://localhost:5173
```

Buka alamat tersebut di browser untuk masuk ke dashboard admin.

### Build frontend

```bash
npm run build
```

Hasil build Vite dibuat di folder `client/dist/`. Untuk melihat hasil build secara lokal:

```bash
npm run preview
```

### Environment frontend untuk deployment

Jika frontend dan backend berjalan pada origin/host berbeda, isi `VITE_API_URL` dengan base URL backend, misalnya:

```env
VITE_API_URL=https://api.example.com
```

Gunakan base URL saja, tanpa akhiran `/api`, karena kode frontend menambahkan prefix `/api` sendiri. Nilai ini juga dipakai untuk koneksi Socket.IO. `VITE_PROXY_TARGET` hanya diperlukan untuk proxy development Vite.

## 4. Menjalankan aplikasi desktop (Electron)

Electron adalah aplikasi pemutar desktop untuk komputer yang terhubung ke layar signage. Electron membuka halaman device yang sudah tersedia pada frontend.

Masuk ke folder desktop:

```bash
cd desktop
npm install
```

Pastikan backend dan frontend sudah berjalan sebelum menjalankan Electron dalam konfigurasi development lokal.

Jalankan dalam mode windowed (tidak fullscreen):

```bash
npm run start:windowed
```

Jalankan dalam mode fullscreen:

```bash
npm start
```

Perintah tersebut akan menjalankan TypeScript build terlebih dahulu, lalu membuka Electron.

### Konfigurasi pertama kali

Saat pertama kali dibuka, aplikasi menampilkan form **Pengaturan device**. Isi:

| Field | Isi |
|---|---|
| Alamat aplikasi panel | URL frontend, misalnya `http://localhost:5173` |
| ID device | UUID device yang dibuat dari dashboard admin |
| Jalankan otomatis saat komputer menyala | Opsional; berlaku untuk aplikasi yang sudah dipaketkan |

Klik **Simpan dan mulai**. Konfigurasi disimpan pada komputer tersebut, kemudian Electron membuka:

```text
<alamat-aplikasi>/device/<device-uuid>
```

Setelah konfigurasi tersimpan, aplikasi berikutnya langsung membuka halaman pemutar. Untuk mengubah konfigurasi, gunakan shortcut:

| Shortcut | Fungsi |
|---|---|
| `Ctrl + Shift + S` | Membuka pengaturan device |
| `Ctrl + R` | Memuat ulang pemutar berdasarkan konfigurasi tersimpan |
| `F11` | Toggle fullscreen |
| `Ctrl + Q` | Keluar dari aplikasi |

Pada macOS, Electron menggunakan padanan `Cmd` untuk shortcut `Ctrl` tersebut.

> Repository ini menyediakan script `start` dan `start:windowed` untuk menjalankan Electron dari source. `package.json` desktop saat ini belum menyediakan script packaging/installer untuk menghasilkan installer Windows, macOS, atau Linux. Pengaturan auto-start hanya diterapkan ketika aplikasi sudah dipaketkan (`app.isPackaged`).

## 5. Alur penggunaan aplikasi

1. Jalankan backend dan frontend.
2. Login ke dashboard menggunakan `ADMIN_USERNAME` dan `ADMIN_PASSWORD` dari `server/.env`.
3. Buat device pada halaman Devices.
4. Buka detail device dan salin UUID device.
5. Buat konten pada halaman Contents. Konten dapat berupa teks, URL, gambar, atau video.
6. Atur playlist device dari halaman detail device, termasuk urutan dan durasi setiap item.
7. Buka halaman `/device/<UUID>` di browser atau konfigurasi aplikasi Electron menggunakan URL frontend dan UUID tersebut.
8. Ketika device berhasil terhubung melalui Socket.IO, status device pada dashboard akan berubah menjadi online.
9. Gunakan fitur push untuk menampilkan konten sesaat pada device yang sedang online. Push tidak mengubah playlist; setelah durasi push selesai, pemutar melanjutkan playlist.

### Catatan tipe konten dan playlist

- Tipe `text` menyimpan teks langsung pada `payload`.
- Tipe `image`, `video`, dan `url` menggunakan URL `http://` atau `https://` pada `payload`.
- Upload file melalui backend hanya menerima file dengan MIME type gambar atau video.
- Batas ukuran upload pada endpoint adalah 50 MB.
- Playlist menerima maksimal 50 item. Durasi item minimal 1 detik dan maksimal 3600 detik; default-nya 10 detik.
- Jika playlist kosong, halaman device menampilkan status menunggu konten.
- Jika device offline, perintah push ditolak; push tidak disimpan sebagai antrean.

## 6. Ringkasan REST API

Semua endpoint REST menggunakan prefix `/api`. Kecuali login dan pembacaan playlist device, endpoint HTTP memerlukan header JWT admin:

```http
Authorization: Bearer <accessToken>
```

### Authentication

| Method | Endpoint | Keterangan | Auth |
|---|---|---|---|
| `POST` | `/api/auth/login` | Login admin dan memperoleh JWT | Public |
| `GET` | `/api/auth/me` | Informasi admin dari JWT | Admin JWT |

Contoh body login:

```json
{
  "username": "admin",
  "password": "password-yang-diatur-di-env"
}
```

### Devices

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/devices` | Daftar device |
| `GET` | `/api/devices/:id` | Detail device |
| `POST` | `/api/devices` | Membuat device |
| `PATCH` | `/api/devices/:id` | Mengubah nama/lokasi device |
| `DELETE` | `/api/devices/:id` | Menghapus device |

### Contents

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/contents` | Daftar konten |
| `GET` | `/api/contents/:id` | Detail konten |
| `POST` | `/api/contents` | Membuat konten teks atau konten berbasis URL |
| `POST` | `/api/contents/upload` | Upload gambar/video ke Supabase Storage |
| `PATCH` | `/api/contents/:id` | Mengubah konten |
| `DELETE` | `/api/contents/:id` | Menghapus konten |

Endpoint upload menggunakan `multipart/form-data`, dengan field file bernama `file` dan field teks `judul`.

### Playlist dan push

| Method | Endpoint | Keterangan | Auth |
|---|---|---|---|
| `GET` | `/api/devices/:deviceId/playlist` | Membaca playlist device | Public untuk kebutuhan device player |
| `PUT` | `/api/devices/:deviceId/playlist` | Mengganti seluruh playlist device | Admin JWT |
| `POST` | `/api/devices/:deviceId/push` | Push konten ke device | Admin JWT |

Contoh body untuk mengganti playlist:

```json
{
  "items": [
    {
      "contentId": "<content-uuid>",
      "durasiDetik": 10
    }
  ]
}
```

Mengirim `items: []` akan mengosongkan playlist device tersebut.

## 7. Komunikasi real-time

Aplikasi menggunakan Socket.IO pada endpoint `/socket.io`.

Event yang digunakan:

| Event | Arah | Kegunaan |
|---|---|---|
| `device:register` | Device → Server | Mendaftarkan koneksi device menggunakan UUID |
| `device:status` | Server → Admin | Mengirim perubahan status online/offline ke dashboard |
| `playlist:updated` | Server → Device | Memberi tahu device bahwa playlist berubah |
| `content:push` | Server → Device | Mengirim konten push untuk ditampilkan segera |

Koneksi Socket.IO admin harus membawa JWT pada handshake. Device tidak menggunakan JWT; device melakukan registrasi menggunakan UUID device. UUID bukan pengganti autentikasi admin dan sebaiknya hanya diberikan kepada perangkat yang memang dikelola.

## 8. Testing dan pemeriksaan

### Backend

```bash
cd server
npm test
npm run test:e2e
npm run lint
npm run build
```

### Frontend

```bash
cd client
npm run lint
npm run build
```

### Desktop

```bash
cd desktop
npm test
```

Test desktop menjalankan TypeScript build dan test untuk validasi konfigurasi, pembentukan URL player, serta penyimpanan konfigurasi.

## 9. Struktur folder

```text
signage-control-panel/
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── scripts/
│   ├── src/
│   │   ├── auth/
│   │   ├── commands/
│   │   ├── contents/
│   │   ├── devices/
│   │   ├── playlist/
│   │   ├── presence/
│   │   ├── prisma/
│   │   ├── realtime/
│   │   └── storage/
│   └── .env.example
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   └── pages/
│   └── .env.example
├── desktop/
│   ├── renderer/
│   └── src/
└── README.md
```

## 10. Troubleshooting

### Frontend tidak dapat menghubungi backend

- Pastikan backend berjalan pada port yang sesuai dengan `PORT`.
- Pastikan `VITE_PROXY_TARGET` mengarah ke alamat backend yang benar.
- Jika menggunakan `VITE_API_URL`, pastikan nilainya adalah base URL backend dan bukan URL yang sudah berakhiran `/api`.
- Setelah mengubah file `.env` frontend, restart Vite.

### Prisma gagal terhubung ke Supabase

- Periksa `DATABASE_URL` dan `DIRECT_URL`.
- Pastikan password database benar dan karakter khusus sudah di-URL-encode.
- Pastikan jenis connection string sesuai: transaction pooler untuk `DATABASE_URL`, session/direct connection untuk `DIRECT_URL` sebagaimana contoh `.env`.
- Jalankan ulang `npx prisma generate` setelah perubahan schema atau konfigurasi Prisma.

### Upload konten gagal

- Periksa `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` di `server/.env`.
- Pastikan bucket dengan nama yang diatur pada `SUPABASE_BUCKET` sudah dibuat.
- Pastikan bucket disetel public agar URL file dapat ditampilkan oleh player.
- Pastikan file berjenis gambar/video dan ukurannya tidak lebih dari 50 MB.

### Device tetap offline

- Pastikan URL frontend yang dimasukkan di Electron dapat diakses dari komputer device.
- Pastikan backend dan koneksi Socket.IO dapat dijangkau dari browser/device.
- Pastikan UUID yang dimasukkan benar dan device tersebut masih ada di database.
- Buka halaman `/device/<UUID>` dan periksa apakah halaman menampilkan status terhubung atau pesan error registrasi.

### Electron menampilkan halaman retry

Halaman retry muncul ketika halaman player gagal dimuat. Aplikasi akan mencoba membuka kembali URL target setiap 5 detik. Periksa koneksi jaringan, alamat frontend, dan apakah frontend sedang berjalan.

## Keamanan

- Jangan commit `server/.env` atau `client/.env`.
- Jangan pernah mengekspos `SUPABASE_SERVICE_ROLE_KEY` atau `JWT_SECRET` ke frontend.
- Gunakan password admin yang kuat dan ganti nilai contoh sebelum deployment.
- Gunakan HTTPS untuk deployment di jaringan publik.
- Batasi akses ke dashboard dan berikan UUID device hanya kepada perangkat yang dikelola.
- Evaluasi kebijakan akses Supabase, CORS, backup database, dan pengelolaan secret sebelum digunakan di production.
