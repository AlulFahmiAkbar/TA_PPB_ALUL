# KOSTARA 🏠

> Platform Pencarian dan Perbandingan Tempat Kos Mahasiswa berbasis Web & PWA (Progressive Web App).

---

## 📁 Struktur Folder Proyek

```text
kostara/
├── api/                    # Serverless API (Node.js, Express, Supabase, JWT)
│   └── index.js            # Entrypoint API server
├── public/                 # Asset publik (favicon, icon PWA, manifest)
├── src/                    # Source code React (komponen, halaman, icons)
├── scripts/                # Script utilitas otomasi (runner dev server)
│   └── dev.js
├── .env                    # [Aman / Terabaikan oleh Git] Kredensial lokal
├── .env.example            # Template master environment variables
├── .gitignore              # Daftar file/folder yang diabaikan Git
├── index.html              # HTML template
├── package.json            # Dependensi utama proyek
├── schema.sql              # Skema database Supabase / PostgreSQL
├── vercel.json             # Konfigurasi routing Vercel
└── vite.config.js          # Konfigurasi Vite & PWA
```

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Prasyarat
- [Node.js](https://nodejs.org/) (versi 18+ disarankan)
- [Git](https://git-scm.com/)

### 2. Instalasi Dependensi
Cukup jalankan sekali di root:
```bash
npm install
```

### 3. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan nilai konfigurasi di dalam `.env`:
- `PORT`: Port server backend (default: 4000)
- `SUPABASE_URL`: URL project Supabase Anda
- `SUPABASE_SERVICE_KEY`: Service role secret key Supabase
- `JWT_SECRET`: Kunci rahasia untuk tanda tangan token login JWT
- `VITE_API_URL`: URL API backend (default lokal: `http://localhost:4000`)

---

## 🛠️ Menjalankan Aplikasi

### Mode Pengembangan (Development)
Menjalankan backend API dan Vite frontend secara bersamaan:
```bash
npm run dev
```

### Mode Produksi (Production Build)
```bash
npm run build
```

---

## ☁️ Deploy ke Vercel

Proyek ini telah dikonfigurasi sebagai **Single Fullstack Project**:
1. Hubungkan repository GitHub ke Vercel.
2. Vercel akan otomatis mengenali proyek ini sebagai **Vite** di root (`./`).
3. Tambahkan Environment Variables di Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET`
4. Klik **Deploy** — Vercel akan otomatis mendeploy frontend dan API serverless dalam satu domain tanpa perlu konfigurasi tambahan!
