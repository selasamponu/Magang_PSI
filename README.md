# 📬 Aplikasi Surat Eksternal - Kemantren Tegalrejo

Sistem Informasi Manajemen Surat Masuk & Surat Keluar Berbasis Web
Dikembangkan untuk Kemantren Tegalrejo Yogyakarta

---

## 📖 Daftar Isi

1. [Tentang Aplikasi](#tentang-aplikasi)
2. [Fitur Lengkap](#fitur-lengkap)
3. [Arsitektur Sistem](#arsitektur-sistem)
4. [Teknologi](#teknologi)
5. [Struktur Folder](#struktur-folder)
6. [Struktur Database](#struktur-database)
7. [Cara Menjalankan](#cara-menjalankan)
8. [Default Login](#default-login)
9. [Panduan Penggunaan](#panduan-penggunaan)
10. [API Endpoints](#api-endpoints)
11. [Keamanan](#keamanan)
12. [Troubleshooting](#troubleshooting)
13. [Deploy](#deploy)
14. [Statistik](#statistik)
15. [Lisensi](#lisensi)

---

## 📖 Tentang Aplikasi

Aplikasi Surat Eksternal adalah sistem informasi berbasis web untuk mengelola surat masuk dan surat keluar di Kemantren Tegalrejo Yogyakarta.

### Tujuan
1. Digitalisasi layanan surat
2. Efisiensi pengelolaan
3. Transparansi status
4. Pelaporan otomatis

---

## ✨ Fitur Lengkap

### Autentikasi
- Login Multi-Role (Admin, Operator, Warga)
- Registrasi Warga (NIK 16 digit)
- Session Management
- Role-Based Access
- Log Aktivitas

### Dashboard
- Admin: 6 KPI Cards, statistik real-time
- Warga: 4 KPI Cards, ringkasan surat

### Surat Masuk
- Kirim surat (upload file max 5MB)
- 15 kategori surat
- Verifikasi operator
- Filter lanjutan
- Pagination 10 per halaman

### Surat Keluar
- Buat surat balasan
- Edit surat
- Hapus surat
- Auto-selesai saat dibaca
- Download file

### Riwayat Surat
- Tab Surat Masuk
- Tab Surat Balasan
- Auto-update status
- Filter status

### Kelola Data
- CRUD Warga
- CRUD User
- Pencarian

### Log Aktivitas
- Pencatatan otomatis
- Filter
- Detail log

### Laporan
- 5 jenis laporan
- Filter tanggal
- Kop surat otomatis
- Format A4 Landscape
- Save as PDF


## 🏗️ Arsitektur Sistem

Frontend: React 18 + TypeScript + Vite (Port 3000)
Backend: Node.js + Express + Multer (Port 5000)
Database: MySQL (Port 3306)
Storage: Folder /uploads

Alur Data:
Warga kirim surat → File disimpan di /uploads → Data di surat_masuk → Operator verifikasi → Admin buat balasan → Data di surat_keluar → Warga buka/download → Status auto selesai → Log tercatat

---

## 🛠️ Teknologi

### Frontend
- React 18.2
- TypeScript 5.7
- Vite 6.3
- Tailwind CSS 4.1
- React Router 6.8
- date-fns 2.30
- lucide-react 0.294
- framer-motion 11.16
- recharts 2.10

### Backend
- Node.js ≥18
- Express.js 5.2
- MySQL2 3.24
- Multer 2.3
- CORS 2.8
- dotenv 17.4

### Database
- MySQL 8.0+
- XAMPP (development)

---

## 📂 Struktur Folder

src/
├── api/suratApi.ts
├── components/Layout.tsx
├── components/Modal.tsx
├── pages/Login.tsx
├── pages/Register.tsx
├── pages/DashboardAdmin.tsx
├── pages/DashboardWarga.tsx
├── pages/SuratMasuk.tsx
├── pages/SuratKeluar.tsx
├── pages/KirimSurat.tsx
├── pages/RiwayatSurat.tsx
├── pages/KelolaWarga.tsx
├── pages/KelolaUser.tsx
├── pages/LogAktivitas.tsx
├── pages/Laporan.tsx
├── pages/VerifikasiSurat.tsx
├── store/auth.ts
├── store/db.ts
├── types/index.ts
├── utils/downloadFile.ts
├── App.tsx
├── main.tsx
└── index.css

uploads/ (file surat)
public/logo.png
database/schema.sql
server.cjs
package.json
vite.config.js
tsconfig.json
index.html
.env
README.md

---

## 🗄️ Struktur Database

### Tabel users
- id (PK, AI)
- nama VARCHAR(100)
- username VARCHAR(50) UNIQUE
- password VARCHAR(255)
- role ENUM(admin, operator)
- status ENUM(aktif, nonaktif)
- tanggal_daftar DATETIME

### Tabel warga
- nik VARCHAR(16) PK
- nama_lengkap VARCHAR(100)
- alamat TEXT
- rt VARCHAR(5)
- rw VARCHAR(5)
- no_hp VARCHAR(15)
- password VARCHAR(255)
- status ENUM(aktif, nonaktif)
- tanggal_daftar DATETIME
- terakhir_login DATETIME

### Tabel surat_masuk
- id_surat VARCHAR(20) PK
- nik_pengirim VARCHAR(16) FK
- nama_pengirim VARCHAR(100)
- metode ENUM(scan, upload)
- kategori VARCHAR(50)
- perihal VARCHAR(255)
- file_url LONGTEXT
- file_name VARCHAR(255)
- file_type VARCHAR(100)
- file_size INT
- catatan TEXT
- status ENUM(terkirim, dibaca, diverifikasi, ditolak)
- tanggal_kirim DATETIME
- tanggal_verifikasi DATETIME
- diverifikasi_oleh VARCHAR(100)
- alasan_tolak TEXT

### Tabel surat_keluar
- id_surat_keluar VARCHAR(20) PK
- nik_penerima VARCHAR(16) FK
- nama_penerima VARCHAR(100)
- nomor_surat VARCHAR(50)
- perihal VARCHAR(255)
- file_url LONGTEXT
- file_name VARCHAR(255)
- file_type VARCHAR(100)
- file_size INT
- tanggal_kirim DATETIME
- status ENUM(terkirim, dibaca, selesai)

### Tabel kategori
- id_kategori INT PK AI
- nama_kategori VARCHAR(50) UNIQUE
- deskripsi TEXT

15 Kategori Default:
1. Surat Edaran
2. Surat Biasa
3. Surat Perintah
4. Surat Tugas
5. Surat Undangan
6. Pengumuman
7. Laporan
8. Telaah Staff
9. Surat Keterangan
10. Surat Keterangan Melaksanakan Tugas
11. Surat Panggilan
12. Nota Dinas
13. Rekomendasi
14. Surat Perjalanan Dinas
15. Surat Cuti

### Tabel log_aktivitas
- id_log VARCHAR(30) PK
- user_id VARCHAR(16)
- nama_user VARCHAR(100)
- user_type ENUM(user, warga)
- aktivitas VARCHAR(50)
- detail TEXT
- ip_address VARCHAR(45)
- tanggal_waktu DATETIME

---

## 🚀 Cara Menjalankan

### Persyaratan
- Node.js ≥18
- NPM ≥9
- MySQL ≥8
- XAMPP
- Browser modern

### Langkah 1: Install
npm install
npm install multer

### Langkah 2: Setup Database
1. Start XAMPP (Apache + MySQL)
2. Buka phpMyAdmin
3. Buat database surat_kemantren
4. Import database/schema.sql

### Langkah 3: Setup .env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=surat_kemantren
DB_PORT=3306
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

### Langkah 4: Jalankan
npm start

### Langkah 5: Buka
http://localhost:3000

---

## 📱 Default Login

Admin: admin / admin123
Operator: operator / operator123
Warga: NIK / password registrasi

---

## 📖 Panduan Penggunaan

### Warga
1. Registrasi
2. Login
3. Kirim Surat
4. Lihat Riwayat
5. Download File

### Admin
1. Dashboard
2. Surat Masuk
3. Surat Keluar
4. Kelola Warga
5. Kelola User
6. Laporan
7. Log Aktivitas

### Operator
1. Login
2. Verifikasi Surat
3. Buat Surat Keluar
4. Laporan

---

## 📊 API Endpoints

Auth:
- POST /api/login
- POST /api/register

Surat Masuk:
- GET /api/surat-masuk
- POST /api/surat-masuk
- PUT /api/surat-masuk/:id/status
- DELETE /api/surat-masuk/:id

Surat Keluar:
- GET /api/surat-keluar
- POST /api/surat-keluar
- PUT /api/surat-keluar/:id
- PUT /api/surat-keluar/:id/status
- DELETE /api/surat-keluar/:id

Warga:
- GET /api/warga
- POST /api/warga
- PUT /api/warga/:nik
- DELETE /api/warga/:nik

User:
- GET /api/users
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id

Lainnya:
- GET /api/kategori
- GET /api/logs
- POST /api/logs
- GET /api/dashboard/:type

---

## 🔐 Keamanan

- Password: plain text (dev), production pakai bcrypt
- Session: localStorage
- CORS: dikonfigurasi untuk LAN
- File Upload: max 10MB, validasi MIME
- SQL Injection: prepared statement
- Role-Based Access: Admin, Operator, Warga
- Log Audit: semua aksi tercatat

---

## 🐛 Troubleshooting

Error: Cannot find module 'multer'
Solusi: npm install multer

Error: ECONNRESET saat upload
Solusi: Buka C:\xampp\mysql\bin\my.ini, tambah max_allowed_packet=64M, restart MySQL

Error: File harus diupload!
Solusi: Cek file sudah dipilih, server.cjs pakai multer, KirimSurat.tsx pakai fileObject

Error: Failed to fetch
Solusi: Backend tidak jalan → npm start, cek IP di suratApi.ts

Error: File corrupt
Solusi: Pastikan server.cjs pakai multer, cek folder uploads/, cek file_url di database

Error: Database tidak connect
Solusi: Pastikan MySQL running, cek .env, pastikan database sudah dibuat

---

## 🌐 Deploy

### Server Gratis
- DCloud XPlore 2026: 3 bulan gratis, VM 2 vCPU, 4GB RAM
- Oracle Cloud Free: selamanya, 4 CPU, 24GB RAM
- Railway: $5/bulan
- Render: 750 jam

### Langkah Deploy VPS
1. Setup server Ubuntu 22.04
2. Install Node.js, MySQL, Nginx
3. Upload kode
4. Setup database
5. Setup .env
6. npm install && npm start
7. Setup Nginx reverse proxy
8. SSL via Let's Encrypt

### Contoh Nginx Config
server {
    listen 80;
    server_name surat-kemantren.go.id;
    location / {
        proxy_pass http://localhost:3000;
    }
    location /api {
        proxy_pass http://localhost:5000;
    }
    location /uploads {
        proxy_pass http://localhost:5000;
    }
}

---

## 📈 Statistik

- Total Halaman: 13
- Total API Endpoint: 24
- Total Tabel Database: 6
- Total Kategori Surat: 15
- Total Role User: 3
- Total Fitur Utama: 12

---

## 🔮 Pengembangan Selanjutnya

- Password hashing bcrypt
- JWT authentication
- Email notification
- WhatsApp notification
- Chart dashboard interaktif
- Export Excel
- Backup otomatis
- Multi-bahasa
- Dark mode
- API documentation

---

## 🤝 Kontribusi

Dikembangkan untuk Kemantren Tegalrejo Yogyakarta.
- Email: support@kemantren-tegalrejo.go.id
- Website: www.kemantren-tegalrejo.go.id

---

## 📄 Lisensi

© 2026 Kemantren Tegalrejo Yogyakarta. All rights reserved.

---

## 🙏 Ucapan Terima Kasih

Terima kasih kepada:
- Kemantren Tegalrejo Yogyakarta
- Tim Developer
- Open Source Community

---

Dibuat dengan ❤️ untuk Kemantren Tegalrejo Yogyakarta
