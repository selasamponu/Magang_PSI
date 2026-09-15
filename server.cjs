// ================================================================
// SERVER API - APLIKASI SURAT KEMANTREN TEGALREJO
// Versi: 6.0.0 (FormData + Edit + Hapus + Auto-Selesai)
// ================================================================
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
const os = require('os');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Load .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ================================================================
// SETUP MULTER (Upload File)
// ================================================================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ================================================================
// FUNGSI: Dapatkan semua IP address lokal
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
// MIDDLEWARE
// ================================================================
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(uploadDir));

app.use((req, res, next) => {
  const origin = req.headers.origin || 'no-origin';
  console.log(`📥 ${req.method} ${req.url} | Origin: ${origin}`);
  next();
});

// ================================================================
// KONEKSI DATABASE
// ================================================================
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'surat_kemantren',
  port: process.env.DB_PORT || 3306
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Kode error:', err.code);
    process.exit(1);
  }
  console.log('✅ Database connected successfully!');
  console.log(`📦 Database: ${process.env.DB_NAME}`);
  console.log(`🔌 Port: ${process.env.DB_PORT}`);
});

// ================================================================
// API ENDPOINTS
// ================================================================

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is running!', version: '6.0.0', timestamp: new Date().toISOString() });
});

// ===== LOGIN =====
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username dan password diperlukan' });
  }

  const sql = 'SELECT * FROM users WHERE username = ? AND password = ? AND status = "aktif"';
  db.query(sql, [username, password], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    if (results.length > 0) {
      const user = results[0];
      db.query(
        'INSERT INTO log_aktivitas (id_log, user_id, nama_user, user_type, aktivitas, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`LOG-${Date.now()}`, user.username, user.nama, 'user', 'LOGIN', `Login sebagai ${user.role}`, req.ip || '127.0.0.1']
      );
      return res.json({ success: true, message: 'Login berhasil!', user: user, userType: 'user' });
    }

    const sqlWarga = 'SELECT * FROM warga WHERE nik = ? AND password = ? AND status = "aktif"';
    db.query(sqlWarga, [username, password], (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err.message });

      if (results.length === 0) {
        return res.status(401).json({ success: false, error: 'Username atau password salah!' });
      }

      const warga = results[0];
      db.query('UPDATE warga SET terakhir_login = NOW() WHERE nik = ?', [warga.nik]);
      db.query(
        'INSERT INTO log_aktivitas (id_log, user_id, nama_user, user_type, aktivitas, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`LOG-${Date.now()}`, warga.nik, warga.nama_lengkap, 'warga', 'LOGIN', 'Login sebagai warga', req.ip || '127.0.0.1']
      );

      res.json({ success: true, message: 'Login berhasil!', user: warga, userType: 'warga' });
    });
  });
});

// ===== REGISTER WARGA =====
app.post('/api/register', (req, res) => {
  const { nik, nama_lengkap, alamat, rt, rw, no_hp, password } = req.body;

  if (!nik || !nama_lengkap || !alamat || !rt || !rw || !no_hp || !password) {
    return res.status(400).json({ success: false, error: 'Semua field harus diisi!' });
  }
  if (nik.length !== 16) {
    return res.status(400).json({ success: false, error: 'NIK harus 16 digit!' });
  }

  const sql = 'INSERT INTO warga (nik, nama_lengkap, alamat, rt, rw, no_hp, password, status) VALUES (?, ?, ?, ?, ?, ?, ?, "aktif")';
  db.query(sql, [nik, nama_lengkap, alamat, rt, rw, no_hp, password], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, error: 'NIK sudah terdaftar!' });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: 'Registrasi berhasil!' });
  });
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

  const fileUrl = `/uploads/${file.filename}`;

  const sql = `INSERT INTO surat_masuk 
    (id_surat, nik_pengirim, nama_pengirim, metode, kategori, perihal, 
     file_url, file_name, file_type, file_size, catatan, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'terkirim')`;

  db.query(sql, [
    id_surat, nik_pengirim, nama_pengirim, metode, kategori, perihal,
    fileUrl, file.originalname, file.mimetype, file.size, catatan
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

  const fileUrl = `/uploads/${file.filename}`;

  const sql = `INSERT INTO surat_keluar 
    (id_surat_keluar, nik_penerima, nama_penerima, nomor_surat, perihal, 
     file_url, file_name, file_type, file_size, qr_code_url, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', 'terkirim')`;

  db.query(sql, [
    id_surat_keluar, nik_penerima, nama_penerima, nomor_surat, perihal,
    fileUrl, file.originalname, file.mimetype, file.size
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

// ✅ UPDATE STATUS SURAT KELUAR (untuk auto-selesai saat warga buka)
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

// ===== WARGA =====
app.get('/api/warga', (req, res) => {
  db.query('SELECT * FROM warga ORDER BY nama_lengkap', (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

app.post('/api/warga', (req, res) => {
  const { nik, nama_lengkap, alamat, rt, rw, no_hp, password } = req.body;
  const sql = 'INSERT INTO warga (nik, nama_lengkap, alamat, rt, rw, no_hp, password, status) VALUES (?, ?, ?, ?, ?, ?, ?, "aktif")';
  db.query(sql, [nik, nama_lengkap, alamat, rt, rw, no_hp, password], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Warga berhasil ditambahkan!' });
  });
});

app.put('/api/warga/:nik', (req, res) => {
  const { nik } = req.params;
  const { nama_lengkap, alamat, rt, rw, no_hp, password } = req.body;
  let sql = 'UPDATE warga SET nama_lengkap = ?, alamat = ?, rt = ?, rw = ?, no_hp = ?';
  const params = [nama_lengkap, alamat, rt, rw, no_hp];
  if (password) {
    sql += ', password = ?';
    params.push(password);
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

// ===== USERS =====
app.get('/api/users', (req, res) => {
  db.query('SELECT id, nama, username, role, status, tanggal_daftar FROM users ORDER BY id', (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

app.post('/api/users', (req, res) => {
  const { nama, username, password, role } = req.body;
  const sql = 'INSERT INTO users (nama, username, password, role, status) VALUES (?, ?, ?, ?, "aktif")';
  db.query(sql, [nama, username, password, role], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'User berhasil ditambahkan!' });
  });
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { nama, username, password, role } = req.body;
  let sql = 'UPDATE users SET nama = ?, username = ?, role = ?';
  const params = [nama, username, role];
  if (password) {
    sql += ', password = ?';
    params.push(password);
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

// ===== KATEGORI =====
app.get('/api/kategori', (req, res) => {
  db.query('SELECT * FROM kategori ORDER BY nama_kategori', (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

// ===== LOG AKTIVITAS =====
app.get('/api/logs', (req, res) => {
  db.query('SELECT * FROM log_aktivitas ORDER BY tanggal_waktu DESC LIMIT 100', (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

app.post('/api/logs', (req, res) => {
  const { id_log, user_id, nama_user, user_type, aktivitas, detail } = req.body;
  const sql = 'INSERT INTO log_aktivitas (id_log, user_id, nama_user, user_type, aktivitas, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [id_log, user_id, nama_user, user_type, aktivitas, detail, req.ip || '127.0.0.1'], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Log berhasil ditambahkan' });
  });
});

// ===== DASHBOARD STATS =====
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
                ditolak: tolR[0].ditolak
              }
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
                    totalUser: uR[0].total
                  }
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
// START SERVER
// ================================================================
app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();

  console.log('========================================');
  console.log('🚀 SERVER RUNNING!');
  console.log('========================================');
  console.log(`💻 Akses dari laptop:`);
  console.log(`   → http://localhost:${PORT}/api/test`);
  console.log('');
  console.log(`📱 Akses dari HP (pilih salah satu):`);
  ips.forEach(ip => {
    console.log(`   → http://${ip.address}:${PORT}/api/test  (${ip.name})`);
  });
  console.log('');
  console.log('========================================');
  console.log('✅ Database connected successfully!');
  console.log(`📦 Database: ${process.env.DB_NAME || 'surat_kemantren'}`);
  console.log(`🔌 Port: ${process.env.DB_PORT || 3306}`);
  console.log('========================================');
});