// ================================================================
// SERVER API - APLIKASI SURAT KEMANTREN TEGALREJO
// Versi: 8.3.0 (NGROK CORS FIX + PDF/GAMBAR ONLY)
// ================================================================
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
const os = require('os');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Load .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

// ================================================================
// TRUST PROXY
// ================================================================
app.set('trust proxy', 1);

// ================================================================
// SETUP MULTER — HANYA PDF & GAMBAR
// ================================================================
const uploadDir = path.join(__dirname, process.env.UPLOAD_PATH || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ HANYA PDF & GAMBAR (Word dihapus)
const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

const ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5 MB default
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIMES.includes(file.mimetype) || !ALLOWED_EXTS.includes(ext)) {
      return cb(new Error('Tipe file tidak diizinkan! Hanya PDF, JPG, JPEG, PNG.'));
    }
    cb(null, true);
  },
});

// ================================================================
// FUNGSI: Dapatkan IP lokal
// ================================================================
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({ name, address: iface.address });
      }
    }
  }
  return ips;
}

// ================================================================
// STATIC FILES /uploads — HARUS DI ATAS SECURITY HEADERS
// ================================================================
app.use('/uploads', (req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  res.removeHeader('Cross-Origin-Opener-Policy');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  res.setHeader('X-Frame-Options', 'ALLOWALL');

  const ext = path.extname(req.path).toLowerCase();
  if (ext === '.pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
  } else if (['.jpg', '.jpeg'].includes(ext)) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', 'inline');
  } else if (ext === '.png') {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline');
  }

  next();
}, express.static(uploadDir, {
  fallthrough: true,
  index: false,
}));

// ================================================================
// SECURITY HEADERS (helmet)
// ================================================================
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  frameguard: false,
}));

app.use((req, res, next) => {
  if (req.path.startsWith('/uploads')) {
    return next();
  }

  const cspDirectives = [
    "default-src 'self'",
    IS_PROD ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: http: https:",
    IS_PROD
      ? "connect-src 'self' https:"
      : "connect-src 'self' http: https: ws: wss:",
    "frame-src 'self' http: https: blob:",
    "frame-ancestors 'self' http://localhost:3000 http://127.0.0.1:3000 http://localhost:5000 http://127.0.0.1:5000 https://*.ngrok-free.dev https://*.ngrok-free.app",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  if (IS_PROD) cspDirectives.push("upgrade-insecure-requests");
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  if (IS_PROD) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), camera=(), microphone=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  next();
});

// ================================================================
// CORS WHITELIST — ✅ SUDAH DIPERBAIKI (IZINKAN NGROK)
// ================================================================
const envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://localhost:3000',
  ...envOrigins,
];

// ✅ Pattern LAN (192.168.x.x, 10.x.x.x)
const LAN_PATTERNS = [
  /^http:\/\/192\.168\.\d+\.\d+:3000$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
  /^https:\/\/192\.168\.\d+\.\d+:3000$/,
  /^https:\/\/10\.\d+\.\d+\.\d+:3000$/,
];

// ✅ Pattern NGROK & CLOUDFLARE TUNNEL (izinkan semua subdomain)
const TUNNEL_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.ngrok-free\.dev$/,
  /^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/,
  /^https:\/\/[a-z0-9-]+\.ngrok\.io$/,
  /^https:\/\/[a-z0-9-]+\.ngrok\.app$/,
  /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/,
];

function isOriginAllowed(origin) {
  // Request tanpa origin (Postman, curl, server-side) — izinkan
  if (!origin) return true;

  // Cek whitelist manual
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  // Cek LAN (untuk development)
  if (!IS_PROD && LAN_PATTERNS.some((r) => r.test(origin))) return true;

  // ✅ Cek tunnel (ngrok, cloudflare, dll) — selalu izinkan
  if (TUNNEL_PATTERNS.some((r) => r.test(origin))) return true;

  return false;
}

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`⚠️ CORS blocked: ${origin}`);
    return callback(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle preflight OPTIONS
app.options('/*splat', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ================================================================
// RATE LIMITER
// ================================================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Terlalu banyak permintaan, coba lagi nanti.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Terlalu banyak percobaan login. Coba lagi 15 menit lagi.' },
});

app.use('/api', globalLimiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

// ================================================================
// REQUEST LOGGER
// ================================================================
app.use((req, res, next) => {
  const origin = req.headers.origin || 'no-origin';
  console.log(`📥 ${req.method} ${req.url} | Origin: ${origin} | IP: ${req.ip}`);
  next();
});

// ================================================================
// KONEKSI DATABASE
// ================================================================
const db = mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'surat_kemantren',
  port: process.env.DB_PORT || 3306,
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Kode error:', err.code);
    process.exit(1);
  }
  console.log('✅ Database connected successfully!');
  console.log(`📦 Database: ${process.env.DB_NAME || 'surat_kemantren'}`);
  console.log(`🔌 Port: ${process.env.DB_PORT || 3306}`);
});

// ================================================================
// HELPERS
// ================================================================
function logActivity(id_log, user_id, nama_user, user_type, aktivitas, detail, ip) {
  const sql = `INSERT INTO log_aktivitas 
    (id_log, user_id, nama_user, user_type, aktivitas, detail, ip_address) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [id_log, user_id, nama_user, user_type, aktivitas, detail, ip || '127.0.0.1'], (err) => {
    if (err) console.error('❌ Log error:', err.message);
  });
}

// ================================================================
// API ENDPOINTS
// ================================================================

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is running!',
    version: '8.3.0',
    env: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ===== LOGIN =====
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username dan password diperlukan' });
  }

  const sql = 'SELECT * FROM users WHERE username = ? AND status = "aktif"';
  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    if (results.length > 0) {
      const user = results[0];

      let match = false;
      try {
        if (user.password.startsWith('$2')) {
          match = await bcrypt.compare(password, user.password);
        } else {
          match = user.password === password;
          if (match) {
            const hash = await bcrypt.hash(password, 10);
            db.query('UPDATE users SET password = ? WHERE id = ?', [hash, user.id]);
          }
        }
      } catch (e) {
        console.error('Bcrypt error:', e.message);
      }

      if (!match) {
        return res.status(401).json({ success: false, error: 'Username atau password salah!' });
      }

      logActivity(
        `LOG-${Date.now()}`,
        user.username,
        user.nama,
        'user',
        'LOGIN',
        `Login sebagai ${user.role}`,
        req.ip
      );

      const { password: _, ...safeUser } = user;
      return res.json({
        success: true,
        message: 'Login berhasil!',
        user: safeUser,
        userType: 'user',
      });
    }

    const sqlWarga = 'SELECT * FROM warga WHERE nik = ? AND status = "aktif"';
    db.query(sqlWarga, [username], async (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err.message });

      if (results.length === 0) {
        return res.status(401).json({ success: false, error: 'Username atau password salah!' });
      }

      const warga = results[0];

      let match = false;
      try {
        if (warga.password.startsWith('$2')) {
          match = await bcrypt.compare(password, warga.password);
        } else {
          match = warga.password === password;
          if (match) {
            const hash = await bcrypt.hash(password, 10);
            db.query('UPDATE warga SET password = ? WHERE nik = ?', [hash, warga.nik]);
          }
        }
      } catch (e) {
        console.error('Bcrypt error:', e.message);
      }

      if (!match) {
        return res.status(401).json({ success: false, error: 'Username atau password salah!' });
      }

      db.query('UPDATE warga SET terakhir_login = NOW() WHERE nik = ?', [warga.nik]);
      logActivity(
        `LOG-${Date.now()}`,
        warga.nik,
        warga.nama_lengkap,
        'warga',
        'LOGIN',
        'Login sebagai warga',
        req.ip
      );

      const { password: _, ...safeWarga } = warga;
      res.json({
        success: true,
        message: 'Login berhasil!',
        user: safeWarga,
        userType: 'warga',
      });
    });
  });
});

// ===== REGISTER WARGA =====
app.post('/api/register', async (req, res) => {
  const { nik, nama_lengkap, alamat, rt, rw, no_hp, password } = req.body;

  if (!nik || !nama_lengkap || !alamat || !rt || !rw || !no_hp || !password) {
    return res.status(400).json({ success: false, error: 'Semua field harus diisi!' });
  }
  if (nik.length !== 16 || !/^\d{16}$/.test(nik)) {
    return res.status(400).json({ success: false, error: 'NIK harus 16 digit angka!' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password minimal 6 karakter!' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    const sql = `INSERT INTO warga 
      (nik, nama_lengkap, alamat, rt, rw, no_hp, password, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, "aktif")`;

    db.query(sql, [nik, nama_lengkap, alamat, rt, rw, no_hp, hashed], (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, error: 'NIK sudah terdaftar!' });
        }
        return res.status(500).json({ success: false, error: err.message });
      }
      logActivity(
        `LOG-${Date.now()}`,
        nik,
        nama_lengkap,
        'warga',
        'REGISTER',
        'Registrasi warga baru',
        req.ip
      );
      res.json({ success: true, message: 'Registrasi berhasil!' });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal hash password' });
  }
});

// ================================================================
// SURAT MASUK
// ================================================================
app.get('/api/surat-masuk', (req, res) => {
  db.query('SELECT * FROM surat_masuk ORDER BY tanggal_kirim DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

app.post('/api/surat-masuk', upload.single('file'), (req, res) => {
  const { id_surat, nik_pengirim, nama_pengirim, metode, kategori, perihal, catatan } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, error: 'File harus diupload!' });
  }
  if (!id_surat || !nik_pengirim || !kategori || !perihal) {
    return res.status(400).json({ success: false, error: 'Data surat tidak lengkap!' });
  }

  const fileUrl = `/uploads/${file.filename}`;

  const sql = `INSERT INTO surat_masuk 
    (id_surat, nik_pengirim, nama_pengirim, metode, kategori, perihal, 
     file_url, file_name, file_type, file_size, catatan, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'terkirim')`;

  db.query(sql, [
    id_surat, nik_pengirim, nama_pengirim, metode || 'upload', kategori, perihal,
    fileUrl, file.originalname, file.mimetype, file.size, catatan || null,
  ], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Surat berhasil dikirim!' });
  });
});

app.put('/api/surat-masuk/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, diverifikasi_oleh, alasan_tolak } = req.body;
  const sql = `UPDATE surat_masuk 
    SET status = ?, tanggal_verifikasi = NOW(), diverifikasi_oleh = ?, alasan_tolak = ? 
    WHERE id_surat = ?`;
  db.query(sql, [status, diverifikasi_oleh || null, alasan_tolak || null, id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Status berhasil diupdate' });
  });
});

app.delete('/api/surat-masuk/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM surat_masuk WHERE id_surat = ?', [id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Surat berhasil dihapus' });
  });
});

// ================================================================
// SURAT KELUAR
// ================================================================
app.get('/api/surat-keluar', (req, res) => {
  db.query('SELECT * FROM surat_keluar ORDER BY tanggal_kirim DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

app.post('/api/surat-keluar', upload.single('file'), (req, res) => {
  const { id_surat_keluar, nik_penerima, nama_penerima, nomor_surat, perihal } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, error: 'File harus diupload!' });
  }
  if (!id_surat_keluar || !nik_penerima || !nomor_surat || !perihal) {
    return res.status(400).json({ success: false, error: 'Data surat tidak lengkap!' });
  }

  const fileUrl = `/uploads/${file.filename}`;

  const sql = `INSERT INTO surat_keluar 
    (id_surat_keluar, nik_penerima, nama_penerima, nomor_surat, perihal, 
     file_url, file_name, file_type, file_size, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'terkirim')`;

  db.query(sql, [
    id_surat_keluar, nik_penerima, nama_penerima || '', nomor_surat, perihal,
    fileUrl, file.originalname, file.mimetype, file.size,
  ], (err) => {
    if (err) {
      console.error('❌ DB error:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    console.log('✅ Surat keluar berhasil disimpan');
    res.json({ success: true, message: 'Surat keluar berhasil dibuat!' });
  });
});

app.put('/api/surat-keluar/:id', upload.single('file'), (req, res) => {
  const { id } = req.params;
  const { nik_penerima, nomor_surat, perihal, file_url, file_name } = req.body;

  try {
    let newFileUrl = file_url;
    let newFileName = file_name;

    if (req.file) {
      newFileUrl = `/uploads/${req.file.filename}`;
      newFileName = req.file.originalname;
    }

    const sql = `UPDATE surat_keluar 
      SET nik_penerima = ?, nomor_surat = ?, perihal = ?, file_url = ?, file_name = ?
      WHERE id_surat_keluar = ?`;

    db.query(sql, [nik_penerima, nomor_surat, perihal, newFileUrl, newFileName, id], (err) => {
      if (err) {
        console.error('❌ DB error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      console.log('✅ Surat keluar berhasil diupdate:', id);
      res.json({ success: true, message: 'Surat keluar berhasil diupdate!' });
    });
  } catch (err) {
    console.error('❌ Update error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/surat-keluar/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, error: 'Status diperlukan' });
  }

  const sql = 'UPDATE surat_keluar SET status = ? WHERE id_surat_keluar = ?';
  db.query(sql, [status, id], (err) => {
    if (err) {
      console.error('❌ DB error:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    console.log(`✅ Status surat keluar ${id} → ${status}`);
    res.json({ success: true, message: 'Status berhasil diupdate' });
  });
});

app.delete('/api/surat-keluar/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM surat_keluar WHERE id_surat_keluar = ?', [id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    console.log('✅ Surat keluar berhasil dihapus:', id);
    res.json({ success: true, message: 'Surat keluar berhasil dihapus!' });
  });
});

// ================================================================
// PENGATURAN APLIKASI
// ================================================================
app.get('/api/pengaturan', (req, res) => {
  db.query('SELECT * FROM pengaturan ORDER BY id_pengaturan LIMIT 1', (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (results.length === 0) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: results[0] });
  });
});

app.put('/api/pengaturan', upload.single('logo_file'), (req, res) => {
  const { nama_aplikasi, nama_instansi, warna_tema, logo_url, favicon_url } = req.body;

  let newLogoUrl = logo_url;
  if (req.file) {
    newLogoUrl = `/uploads/${req.file.filename}`;
  }

  db.query('SELECT id_pengaturan FROM pengaturan LIMIT 1', (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    if (results.length === 0) {
      const insertSql = `INSERT INTO pengaturan 
        (nama_aplikasi, nama_instansi, warna_tema, logo_url, favicon_url) 
        VALUES (?, ?, ?, ?, ?)`;
      db.query(insertSql, [
        nama_aplikasi || 'Aplikasi Surat',
        nama_instansi || 'Kemantren Tegalrejo',
        warna_tema || '#8B3A1A',
        newLogoUrl || '',
        favicon_url || newLogoUrl || '',
      ], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: 'Pengaturan berhasil dibuat!' });
      });
    } else {
      const updateSql = `UPDATE pengaturan SET 
        nama_aplikasi = ?, nama_instansi = ?, warna_tema = ?, 
        logo_url = ?, favicon_url = ?
        WHERE id_pengaturan = ?`;
      db.query(updateSql, [
        nama_aplikasi, nama_instansi, warna_tema, newLogoUrl,
        favicon_url || newLogoUrl,
        results[0].id_pengaturan,
      ], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: 'Pengaturan berhasil diupdate!' });
      });
    }
  });
});

// ================================================================
// WARGA
// ================================================================
app.get('/api/warga', (req, res) => {
  db.query(
    'SELECT nik, nama_lengkap, alamat, rt, rw, no_hp, status, tanggal_daftar, terakhir_login FROM warga ORDER BY nama_lengkap',
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: results });
    }
  );
});

app.post('/api/warga', async (req, res) => {
  const { nik, nama_lengkap, alamat, rt, rw, no_hp, password } = req.body;

  if (!nik || !nama_lengkap || !password) {
    return res.status(400).json({ success: false, error: 'Data tidak lengkap' });
  }
  if (nik.length !== 16) {
    return res.status(400).json({ success: false, error: 'NIK harus 16 digit!' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO warga (nik, nama_lengkap, alamat, rt, rw, no_hp, password, status) VALUES (?, ?, ?, ?, ?, ?, ?, "aktif")';
    db.query(sql, [nik, nama_lengkap, alamat, rt, rw, no_hp, hashed], (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, error: 'NIK sudah terdaftar!' });
        }
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, message: 'Warga berhasil ditambahkan!' });
    });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Gagal hash password' });
  }
});

app.put('/api/warga/:nik', async (req, res) => {
  const { nik } = req.params;
  const { nama_lengkap, alamat, rt, rw, no_hp, password } = req.body;

  let sql = 'UPDATE warga SET nama_lengkap = ?, alamat = ?, rt = ?, rw = ?, no_hp = ?';
  const params = [nama_lengkap, alamat, rt, rw, no_hp];

  if (password) {
    try {
      const hashed = await bcrypt.hash(password, 10);
      sql += ', password = ?';
      params.push(hashed);
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Gagal hash password' });
    }
  }

  sql += ' WHERE nik = ?';
  params.push(nik);

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Warga berhasil diupdate!' });
  });
});

app.delete('/api/warga/:nik', (req, res) => {
  const { nik } = req.params;
  db.query('DELETE FROM warga WHERE nik = ?', [nik], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Warga berhasil dihapus!' });
  });
});

// ================================================================
// USERS
// ================================================================
app.get('/api/users', (req, res) => {
  db.query(
    'SELECT id, nama, username, role, status, tanggal_daftar FROM users ORDER BY id',
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: results });
    }
  );
});

app.post('/api/users', async (req, res) => {
  const { nama, username, password, role } = req.body;

  if (!nama || !username || !password) {
    return res.status(400).json({ success: false, error: 'Data tidak lengkap' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password minimal 6 karakter!' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (nama, username, password, role, status) VALUES (?, ?, ?, ?, "aktif")';
    db.query(sql, [nama, username, hashed, role || 'operator'], (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, error: 'Username sudah digunakan!' });
        }
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, message: 'User berhasil ditambahkan!' });
    });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Gagal hash password' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { nama, username, password, role } = req.body;

  let sql = 'UPDATE users SET nama = ?, username = ?, role = ?';
  const params = [nama, username, role];

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password minimal 6 karakter!' });
    }
    try {
      const hashed = await bcrypt.hash(password, 10);
      sql += ', password = ?';
      params.push(hashed);
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Gagal hash password' });
    }
  }

  sql += ' WHERE id = ?';
  params.push(id);

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'User berhasil diupdate!' });
  });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM users WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'User berhasil dihapus!' });
  });
});

// ================================================================
// KATEGORI
// ================================================================
app.get('/api/kategori', (req, res) => {
  db.query('SELECT * FROM kategori ORDER BY nama_kategori', (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

// ================================================================
// LOG AKTIVITAS
// ================================================================
app.get('/api/logs', (req, res) => {
  db.query('SELECT * FROM log_aktivitas ORDER BY tanggal_waktu DESC LIMIT 100', (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

app.post('/api/logs', (req, res) => {
  const { id_log, user_id, nama_user, user_type, aktivitas, detail } = req.body;
  const sql = `INSERT INTO log_aktivitas 
    (id_log, user_id, nama_user, user_type, aktivitas, detail, ip_address) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [id_log, user_id, nama_user, user_type, aktivitas, detail, req.ip || '127.0.0.1'], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Log berhasil ditambahkan' });
  });
});

// ================================================================
// DASHBOARD STATS
// ================================================================
app.get('/api/dashboard/:type', (req, res) => {
  const { type } = req.params;
  const { userId } = req.query;

  if (type === 'warga' && userId) {
    db.query('SELECT COUNT(*) as total FROM surat_masuk WHERE nik_pengirim = ?', [userId], (err, totalR) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      db.query('SELECT COUNT(*) as menunggu FROM surat_masuk WHERE nik_pengirim = ? AND status IN ("terkirim","dibaca")', [userId], (err, menungguR) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        db.query('SELECT COUNT(*) as diverifikasi FROM surat_masuk WHERE nik_pengirim = ? AND status = "diverifikasi"', [userId], (err, divR) => {
          if (err) return res.status(500).json({ success: false, error: err.message });
          db.query('SELECT COUNT(*) as ditolak FROM surat_masuk WHERE nik_pengirim = ? AND status = "ditolak"', [userId], (err, tolR) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({
              success: true,
              data: {
                totalSurat: totalR[0].total,
                menunggu: menungguR[0].menunggu,
                diverifikasi: divR[0].diverifikasi,
                ditolak: tolR[0].ditolak,
              },
            });
          });
        });
      });
    });
  } else {
    db.query('SELECT COUNT(*) as total FROM surat_masuk', (err, sR) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      db.query('SELECT COUNT(*) as total FROM surat_masuk WHERE status IN ("terkirim","dibaca")', (err, mR) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        db.query('SELECT COUNT(*) as total FROM surat_masuk WHERE status = "diverifikasi"', (err, dR) => {
          if (err) return res.status(500).json({ success: false, error: err.message });
          db.query('SELECT COUNT(*) as total FROM surat_masuk WHERE status = "ditolak"', (err, tR) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            db.query('SELECT COUNT(*) as total FROM warga', (err, wR) => {
              if (err) return res.status(500).json({ success: false, error: err.message });
              db.query('SELECT COUNT(*) as total FROM users', (err, uR) => {
                if (err) return res.status(500).json({ success: false, error: err.message });
                res.json({
                  success: true,
                  data: {
                    totalSuratMasuk: sR[0].total,
                    menungguVerifikasi: mR[0].total,
                    diverifikasi: dR[0].total,
                    ditolak: tR[0].total,
                    totalWarga: wR[0].total,
                    totalUser: uR[0].total,
                  },
                });
              });
            });
          });
        });
      });
    });
  }
});

// ================================================================
// ERROR HANDLER
// ================================================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'Ukuran file terlalu besar! Maksimal 5MB.' });
    }
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err.message && err.message.includes('Tipe file tidak diizinkan')) {
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err.message === 'CORS not allowed') {
    return res.status(403).json({ success: false, error: 'Akses ditolak oleh CORS policy' });
  }
  res.status(500).json({ success: false, error: IS_PROD ? 'Terjadi kesalahan server' : err.message });
});

// ================================================================
// START SERVER
// ================================================================
app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();

  console.log('========================================');
  console.log('🚀 SERVER RUNNING!');
  console.log(`🔒 ENV: ${NODE_ENV}`);
  console.log('========================================');
  console.log(`💻 Akses dari laptop:`);
  console.log(`   → http://localhost:${PORT}/api/test`);
  console.log('');
  console.log(`📱 Akses dari HP (pilih salah satu):`);
  ips.forEach((ip) => {
    console.log(`   → http://${ip.address}:${PORT}/api/test  (${ip.name})`);
  });
  console.log('');
  console.log('========================================');
  console.log('✅ Database connected successfully!');
  console.log(`📦 Database: ${process.env.DB_NAME || 'surat_kemantren'}`);
  console.log(`🔌 Port: ${process.env.DB_PORT || 3306}`);
  console.log('========================================');
});