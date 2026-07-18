# Komunitas Lord — Pendaftaran Real-time (Tema Bola)

Website pendaftaran anggota bertema bola untuk **Komunitas Lord**, dengan
notifikasi bergabung real-time, daftar anggota live, dan ID Card yang bisa
didownload. Tanpa `members.json` — semua data disimpan di memory server saja.

## Struktur
```
komunitas-lord/
├─ server.js         → server Node.js (Express + Socket.IO) untuk hosting biasa (VPS/Render/Railway/Fly.io)
├─ public/            → frontend (HTML/CSS/JS), semua ikon pakai SVG
│  ├─ index.html
│  ├─ style.css
│  ├─ app.js
│  └─ avatars.js
├─ api/               → serverless functions untuk mode Vercel (fallback polling, tanpa Socket.IO)
│  ├─ join.js
│  ├─ members.js
│  └─ _store.js
└─ vercel.json
```

## Cara jalan lokal
```bash
npm install
npm start
# buka http://localhost:3000
```

## Cara kerja real-time
- Saat jalan dengan `server.js` (Node.js biasa), real-time pakai **Socket.IO**
  (WebSocket asli) — setiap ada yang daftar, semua browser yang terbuka
  langsung dapat notifikasi & update tabel anggota tanpa refresh.
- Kalau `app.js` mendeteksi Socket.IO tidak tersedia (misalnya di Vercel),
  otomatis pindah ke mode **polling** — browser cek data baru ke
  `/api/members` tiap 2 detik. Tetap terasa real-time di halaman.

## ⚠️ Catatan penting soal hosting Vercel
Vercel (serverless) **tidak mendukung koneksi WebSocket/Socket.IO yang
persisten**. Folder `api/` sudah dibuat kompatibel dengan Vercel (tanpa file
`members.json`, data disimpan di memory function), jadi website tetap bisa
di-deploy dan berjalan — tapi real-time-nya akan lewat **polling 2 detik**,
bukan WebSocket asli, dan data akan reset kalau function "dingin" (cold
start) karena tidak lama dipakai.

Kalau butuh real-time WebSocket 100% (Socket.IO asli) yang selalu nyambung,
sebaiknya deploy `server.js` di hosting Node.js yang mendukung koneksi
persisten, seperti **Render, Railway, Fly.io, atau VPS** — bukan Vercel.

## Kustomisasi
- **Link grup WhatsApp**: ada di `public/index.html` (tombol "Join Komunitas")
  dan sudah diisi sesuai link yang kamu berikan.
- **Avatar**: daftar avatar ada di `public/avatars.js` (`AVATAR_LIST`), tinggal
  tambah/ubah warna jersey untuk bikin avatar baru — semua digambar pakai
  shape canvas, jadi ringan dan tidak butuh file gambar.
- **Warna tema bola**: variabel CSS ada di bagian `:root` pada
  `public/style.css`.
