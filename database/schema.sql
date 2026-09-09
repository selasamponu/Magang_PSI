-- ================================================================
-- DATABASE: surat_kemantren
-- Aplikasi Surat - Kemantren Tegalrejo
-- ================================================================

CREATE DATABASE IF NOT EXISTS surat_kemantren CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE surat_kemantren;

-- ================================================================
-- TABEL: users (Admin & Operator)
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
  terakhir_login DATETIME
) ENGINE=InnoDB;

-- ================================================================
-- TABEL: surat_masuk
-- ================================================================
CREATE TABLE IF NOT EXISTS surat_masuk (
  id_surat VARCHAR(20) PRIMARY KEY,
  nik_pengirim VARCHAR(16) NOT NULL,
  nama_pengirim VARCHAR(100) NOT NULL,
  metode ENUM('scan', 'upload') NOT NULL,
  kategori VARCHAR(50) NOT NULL,
  perihal VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) DEFAULT NULL,
  catatan TEXT,
  status ENUM('terkirim', 'dibaca', 'diverifikasi', 'ditolak') DEFAULT 'terkirim',
  tanggal_kirim DATETIME DEFAULT CURRENT_TIMESTAMP,
  tanggal_verifikasi DATETIME,
  diverifikasi_oleh VARCHAR(100),
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
  qr_code_url TEXT,
  tanggal_kirim DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('terkirim', 'dibaca', 'selesai') DEFAULT 'terkirim',
  FOREIGN KEY (nik_penerima) REFERENCES warga(nik) ON DELETE RESTRICT,
  INDEX idx_tanggal (tanggal_kirim),
  INDEX idx_penerima (nik_penerima)
) ENGINE=InnoDB;

-- ================================================================
-- TABEL: kategori
-- ================================================================
CREATE TABLE IF NOT EXISTS kategori (
  id_kategori INT PRIMARY KEY AUTO_INCREMENT,
  nama_kategori VARCHAR(50) UNIQUE NOT NULL,
  deskripsi TEXT
) ENGINE=InnoDB;

-- ================================================================
-- TABEL: log_aktivitas
-- ================================================================
CREATE TABLE IF NOT EXISTS log_aktivitas (
  id_log VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(16) NOT NULL,
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
-- DATA DEFAULT: Kategori (9 item)
-- ================================================================
INSERT INTO kategori (nama_kategori, deskripsi) VALUES
('Surat Undangan', 'Surat undangan resmi'),
('Surat Pernyataan', 'Surat pernyataan resmi'),
('Surat Keterangan', 'Surat keterangan resmi'),
('Surat Rekomendasi', 'Surat rekomendasi resmi'),
('Surat Permohonan', 'Surat permohonan resmi'),
('Surat Pemberitahuan', 'Surat pemberitahuan resmi'),
('Surat Pengaduan', 'Surat pengaduan resmi'),
('Surat Izin', 'Surat izin resmi'),
('Surat Lainnya', 'Surat lainnya');

-- ================================================================
-- DATA DEFAULT: Users
-- Password: admin123 dan operator123 (bcrypt hash)
-- ================================================================
INSERT INTO users (nama, username, password, role, status) VALUES
('Administrator', 'admin', '$2a$10$rDkPvvAFVqy0OeJZQy6mXeNPGM1gGnLzGjHhNnm3YvF1KzQmVkOy', 'admin', 'aktif'),
('Operator', 'operator', '$2a$10$rDkPvvAFVqy0OeJZQy6mXeNPGM1gGnLzGjHhNnm3YvF1KzQmVkOy', 'operator', 'aktif');

-- ================================================================
-- CATATAN:
-- 1. Password hash di atas adalah contoh. Ganti dengan hash bcrypt yang valid.
-- 2. Untuk generate hash bcrypt, gunakan Node.js:
--    const bcrypt = require('bcryptjs');
--    bcrypt.hashSync('admin123', 10);
-- 3. Jalankan file ini di phpMyAdmin atau MySQL CLI:
--    mysql -u root -p < schema.sql
-- ================================================================
