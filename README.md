# 📬 Aplikasi Surat - Kemantren Tegalrejo

Aplikasi pengelolaan surat masuk dan keluar untuk Kemantren Tegalrejo.

## 🚀 Fitur Utama

### ✅ Fitur yang Sudah Berfungsi
1. **Login Multi-Role** - Admin, Operator, dan Warga
2. **Dashboard Admin** - 6 KPI Cards dengan statistik real-time
3. **Dashboard Warga** - 4 KPI Cards dengan ringkasan surat
4. **Surat Masuk** - Dengan filter canggih (kategori, tanggal, bulan, tahun, rentang tanggal)
5. **Surat Keluar** - Dengan QR Code otomatis
6. **Kelola Warga** - CRUD lengkap dengan toggle status
7. **Kelola User** - CRUD untuk admin/operator
8. **Log Aktivitas** - Pencatatan semua aktivitas
9. **Kirim Surat** - Upload file atau scan fisik
10. **Riwayat Surat** - Untuk warga melihat surat mereka
11. **Responsif** - Mobile-first design untuk semua halaman
12. **Pencarian Lanjutan** - Filter multi-kriteria di Surat Masuk

## 📱 Default Login

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Operator | operator | operator123 |
| Warga | (NIK) | (password saat registrasi) |

## 🛠️ Teknologi

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 4
- **Storage**: localStorage (untuk demo/development)
- **QR Code**: qrcode library
- **Database Ready**: MySQL schema tersedia di `database/schema.sql`

## 📦 Cara Menjalankan (Development/Local)

### 1. Install Dependencies
```bash
npm install
```

### 2. Jalankan Development Server
```bash
npm run dev
```

### 3. Build untuk Production
```bash
npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```

## 🗄️ Setup Database MySQL (XAMPP)

### Langkah-langkah:

1. **Start XAMPP** - Jalankan Apache dan MySQL

2. **Buat Database** - Buka phpMyAdmin (http://localhost/phpmyadmin)
   ```sql
   CREATE DATABASE surat_kemantren CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Import Schema** - Jalankan file SQL:
   ```bash
   mysql -u root -p surat_kemantren < database/schema.sql
   ```
   Atau import melalui phpMyAdmin:
   - Pilih database `surat_kemantren`
   - Klik tab "Import"
   - Upload file `database/schema.sql`
   - Klik "Go"

4. **Setup .env** - Copy file `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edit file `.env` sesuai konfigurasi MySQL Anda:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=        # Isi jika MySQL punya password
   DB_NAME=surat_kemantren
   DB_PORT=3306
   ```

5. **Generate Password Hash** - Untuk membuat hash bcrypt yang valid:
   ```javascript
   // Jalankan di Node.js
   const bcrypt = require('bcryptjs');
   console.log(bcrypt.hashSync('admin123', 10));
   ```
   Copy hash yang dihasilkan dan update di tabel `users`.

## 🌐 Deploy ke Server/Hosting

### Opsi 1: Shared Hosting (cPanel)

1. **Upload File** - Upload folder `dist/` ke `public_html/`
2. **Setup Database** - Buat database MySQL di cPanel
3. **Import Schema** - Import `database/schema.sql` melalui phpMyAdmin
4. **Update Config** - Sesuaikan koneksi database di backend

### Opsi 2: VPS/Cloud Server

1. **Setup Environment**:
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install MySQL
   sudo apt-get install mysql-server
   
   # Install Nginx
   sudo apt-get install nginx
   ```

2. **Setup Database**:
   ```bash
   sudo mysql -u root -p
   CREATE DATABASE surat_kemantren CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE surat_kemantren;
   SOURCE /path/to/database/schema.sql;
   ```

3. **Build & Deploy**:
   ```bash
   npm install
   npm run build
   
   # Copy dist/ ke /var/www/html/
   sudo cp -r dist/* /var/www/html/
   ```

4. **Setup Nginx**:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /var/www/html;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

### Opsi 3: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t surat-kemantren .
docker run -p 80:80 surat-kemantren
```

## 📂 Struktur Database

### Tabel Utama:
- `users` - Admin & Operator
- `warga` - Data warga
- `surat_masuk` - Surat masuk dari warga
- `surat_keluar` - Surat keluar dari kemantren
- `kategori` - Kategori surat (9 kategori default)
- `log_aktivitas` - Log semua aktivitas

### Index untuk Performa:
- `idx_status` pada surat_masuk
- `idx_kategori` pada surat_masuk
- `idx_tanggal` pada surat_masuk & surat_keluar
- `idx_pengirim` pada surat_masuk
- `idx_penerima` pada surat_keluar

## 🔍 Fitur Filter Surat Masuk

Filter yang tersedia:
- ✅ **Pencarian Teks** - ID, nama pengirim, NIK, perihal
- ✅ **Kategori** - Filter berdasarkan 9 kategori surat
- ✅ **Status** - Terkirim, Dibaca, Diverifikasi, Ditolak
- ✅ **Metode** - Scan atau Upload
- ✅ **Tahun** - Filter berdasarkan tahun
- ✅ **Bulan** - Filter berdasarkan bulan (Januari - Desember)
- ✅ **Rentang Tanggal** - Dari tanggal sampai tanggal
- ✅ **Pagination** - 10 data per halaman

## 📱 Responsive Design

Aplikasi ini menggunakan **mobile-first approach**:
- **Mobile** (< 640px): Card layout, sidebar drawer
- **Tablet** (640px - 1024px): Mixed layout
- **Desktop** (> 1024px): Full table layout, sidebar fixed

## 🔐 Keamanan

- Password di-hash dengan bcrypt
- JWT token untuk autentikasi (6 jam)
- Role-based access control (RBAC)
- Input validation di semua form
- File upload dibatasi 5MB

## 📝 Catatan Penting

### Untuk Development (Sekarang):
- Aplikasi menggunakan **localStorage** sebagai database
- Data tersimpan di browser, tidak hilang saat refresh
- Cocok untuk demo dan testing

### Untuk Production (Nanti):
- Ganti localStorage dengan MySQL
- Gunakan file `database/schema.sql` yang sudah disediakan
- Setup backend API (Node.js + Express)
- Konfigurasi `.env` sesuai server

## 🐛 Troubleshooting

### Database tidak terkoneksi:
- Pastikan MySQL berjalan di XAMPP
- Cek username/password di `.env`
- Pastikan database `surat_kemantren` sudah dibuat

### Password tidak bisa login:
- Generate ulang hash bcrypt
- Update di tabel `users`
- Default: admin/admin123, operator/operator123

### Build error:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📞 Support

Untuk pertanyaan atau bantuan:
- Email: support@kemantren-tegalrejo.go.id
- Website: www.kemantren-tegalrejo.go.id

## 📄 Lisensi

© 2026 Kemantren Tegalrejo. All rights reserved.

---

**Dibuat dengan ❤️ untuk Kemantren Tegalrejo**
