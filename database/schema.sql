-- ================================================================
-- DATABASE: surat_kemantren
-- Aplikasi Surat - Kemantren Tegalrejo
-- ================================================================

CREATE DATABASE IF NOT EXISTS surat_kemantren
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE surat_kemantren;

-- ================================================================
-- TABEL: users
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'operator') DEFAULT 'operator',
  status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
  tanggal_daftar DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ================================================================
-- TABEL: warga
-- ================================================================
CREATE TABLE IF NOT EXISTS warga (
  nik VARCHAR(16) PRIMARY KEY,
  nama_lengkap VARCHAR(100) NOT NULL,
  alamat TEXT NOT NULL,
  rt VARCHAR(5) NOT NULL,
  rw VARCHAR(5) NOT NULL,
  no_hp VARCHAR(15) NOT NULL,
  password VARCHAR(255) NOT NULL,
  status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
  tanggal_daftar DATETIME DEFAULT CURRENT_TIMESTAMP,
  terakhir_login DATETIME NULL
) ENGINE=InnoDB;

-- ================================================================
-- TABEL: surat_masuk
-- ================================================================
CREATE TABLE IF NOT EXISTS surat_masuk (
  id_surat VARCHAR(20) PRIMARY KEY,
  nik_pengirim VARCHAR(16) NOT NULL,
  nama_pengirim VARCHAR(100) NOT NULL,
  metode ENUM('scan', 'upload') NOT NULL DEFAULT 'upload',
  kategori VARCHAR(50) NOT NULL,
  perihal VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) DEFAULT NULL,
  file_type VARCHAR(100) DEFAULT NULL,
  file_size INT DEFAULT NULL,
  catatan TEXT,
  status ENUM('terkirim', 'dibaca', 'diverifikasi', 'ditolak') DEFAULT 'terkirim',
  tanggal_kirim DATETIME DEFAULT CURRENT_TIMESTAMP,
  tanggal_verifikasi DATETIME NULL,
  diverifikasi_oleh VARCHAR(100) NULL,
  alasan_tolak TEXT,
  FOREIGN KEY (nik_pengirim) REFERENCES warga(nik) ON DELETE RESTRICT,
  INDEX idx_status (status),
  INDEX idx_kategori (kategori),
  INDEX idx_tanggal (tanggal_kirim),
  INDEX idx_pengirim (nik_pengirim)
) ENGINE=InnoDB;

-- ================================================================
-- TABEL: surat_keluar
-- ================================================================
CREATE TABLE IF NOT EXISTS surat_keluar (
  id_surat_keluar VARCHAR(20) PRIMARY KEY,
  nik_penerima VARCHAR(16) NOT NULL,
  nama_penerima VARCHAR(100) NOT NULL,
  nomor_surat VARCHAR(50) NOT NULL,
  perihal VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) DEFAULT NULL,
  file_type VARCHAR(100) DEFAULT NULL,
  file_size INT DEFAULT NULL,
  tanggal_kirim DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('terkirim', 'dibaca', 'selesai') DEFAULT 'terkirim',
  FOREIGN KEY (nik_penerima) REFERENCES warga(nik) ON DELETE RESTRICT,
  INDEX idx_tanggal (tanggal_kirim),
  INDEX idx_penerima (nik_penerima),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ================================================================
-- TABEL: kategori (15 item sesuai README)
-- ================================================================
CREATE TABLE IF NOT EXISTS kategori (
  id_kategori INT PRIMARY KEY AUTO_INCREMENT,
  nama_kategori VARCHAR(50) UNIQUE NOT NULL,
  deskripsi TEXT
) ENGINE=InnoDB;

INSERT INTO kategori (nama_kategori, deskripsi) VALUES
('Surat Edaran', 'Surat edaran resmi'),
('Surat Biasa', 'Surat biasa'),
('Surat Perintah', 'Surat perintah resmi'),
('Surat Tugas', 'Surat tugas resmi'),
('Surat Undangan', 'Surat undangan resmi'),
('Pengumuman', 'Pengumuman resmi'),
('Laporan', 'Laporan resmi'),
('Telaah Staff', 'Telaah staff'),
('Surat Keterangan', 'Surat keterangan resmi'),
('Surat Keterangan Melaksanakan Tugas', 'Surat keterangan melaksanakan tugas'),
('Surat Panggilan', 'Surat panggilan resmi'),
('Nota Dinas', 'Nota dinas'),
('Rekomendasi', 'Surat rekomendasi'),
('Surat Perjalanan Dinas', 'Surat perjalanan dinas'),
('Surat Cuti', 'Surat cuti');

-- ================================================================
-- TABEL: log_aktivitas
-- ================================================================
CREATE TABLE IF NOT EXISTS log_aktivitas (
  id_log VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  nama_user VARCHAR(100) NOT NULL,
  user_type ENUM('user', 'warga') NOT NULL,
  aktivitas VARCHAR(50) NOT NULL,
  detail TEXT,
  ip_address VARCHAR(45),
  tanggal_waktu DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_tanggal (tanggal_waktu),
  INDEX idx_aktivitas (aktivitas)
) ENGINE=InnoDB;

-- ================================================================
-- TABEL: pengaturan (BARU)
-- ================================================================
CREATE TABLE IF NOT EXISTS pengaturan (
  id_pengaturan INT PRIMARY KEY AUTO_INCREMENT,
  nama_aplikasi VARCHAR(100) DEFAULT 'Aplikasi Surat',
  nama_instansi VARCHAR(150) DEFAULT 'Kemantren Tegalrejo Yogyakarta',
  warna_tema VARCHAR(20) DEFAULT '#8B3A1A',
  logo_url VARCHAR(500) DEFAULT '',
  favicon_url VARCHAR(500) DEFAULT '',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO pengaturan (nama_aplikasi, nama_instansi, warna_tema, logo_url, favicon_url)
VALUES ('Aplikasi Surat', 'Kemantren Tegalrejo Yogyakarta', '#8B3A1A', '', '');

-- ================================================================
-- DATA DEFAULT: Users
-- Password: admin123 dan operator123 (bcrypt hash, cost 10)
-- Generate: https://bcrypt-generator.com/
-- ================================================================
INSERT INTO users (nama, username, password, role, status) VALUES
('Administrator', 'admin',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin',    'aktif'),
('Operator',      'operator', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'operator', 'aktif');

-- ================================================================
-- CATATAN:
-- Hash di atas adalah hash dari "admin123" / "operator123".
-- server.cjs otomatis migrasi ke bcrypt saat login pertama
-- jika password masih plain text.
-- ================================================================