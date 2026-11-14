# KOSTARA 🏠

> Platform Pencarian dan Perbandingan Tempat Kos Mahasiswa berbasis Web & PWA (Progressive Web App).

---

## 📁 Struktur Folder Proyek

```text
kostara/
├── backend/                # Server API (Node.js, Express, Supabase, JWT)
│   ├── .env.example        # Template konfigurasi environment backend
│   ├── package.json        # Dependensi backend
│   ├── schema.sql          # Skema database Supabase / PostgreSQL
│   └── server.js           # Entrypoint server backend
├── frontend/               # Client Web App (React, Vite, PWA, Tailwind/CSS)
│   ├── .env.example        # Template konfigurasi environment frontend
│   ├── index.html          # HTML template
│   ├── package.json        # Dependensi frontend
│   ├── vite.config.js      # Konfigurasi Vite & PWA
│   ├── public/             # Asset publik (favicon, icon PWA, manifest)
│   └── src/                # Source code React (komponen, halaman, icons)
├── scripts/                # Script utilitas otomasi
│   └── dev.js              # Script runner paralel backend & frontend
├── .env.example            # Template master environment variables
├── .gitignore              # Daftar file/folder yang diabaikan Git
└── package.json            # Script manajemen monorepo di root
```

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Prasyarat
- [Node.js](https://nodejs.org/) (versi 18+ disarankan)
- [Git](https://git-scm.com/)

### 2. Instalasi Dependensi
Jalankan instalasi dependensi untuk backend dan frontend:
```bash
# Instal dependensi backend
cd backend
npm install

# Instal dependensi frontend
cd ../frontend
npm install

# Kembali ke folder root
cd ..
```

### 3. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env` di folder root (atau di masing-masing folder `backend/` dan `frontend/`):
```bash
cp .env.example .env
```
Sesuaikan nilai konfigurasi di dalam `.env`:
- `PORT`: Port server backend (default: 4000)
- `SUPABASE_URL`: URL project Supabase Anda
- `SUPABASE_SERVICE_KEY`: Service role secret key Supabase
- `JWT_SECRET`: Kunci rahasia untuk tanda tangan token login JWT
- `VITE_API_URL`: URL API yang diakses frontend (default: `http://localhost:4000`)

---

## 🛠️ Menjalankan Aplikasi

### Mode Pengembangan (Development)
Menjalankan server backend (port 4000) dan frontend (port 5173) secara bersamaan:
```bash
npm run dev
```

### Mode Produksi (Production Build)
Membuat build optimal untuk frontend:
```bash
npm run build
```

Hasil build akan berada di `frontend/dist/` dan siap dideploy ke platform hosting (Vercel, Netlify, VPS, dsb).

