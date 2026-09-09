export interface User {
  id: number;
  nama: string;
  username: string;
  password: string;
  role: 'admin' | 'operator';
  status: 'aktif' | 'nonaktif';
  tanggal_daftar: string;
}

export interface Warga {
  nik: string;
  nama_lengkap: string;
  alamat: string;
  rt: string;
  rw: string;
  no_hp: string;
  password: string;
  status: 'aktif' | 'nonaktif';
  tanggal_daftar: string;
  terakhir_login: string | null;
}

export interface SuratMasuk {
  id_surat: string;
  nik_pengirim: string;
  nama_pengirim: string;
  metode: 'scan' | 'upload';
  kategori: string;
  perihal: string;
  file_url: string;
  file_name: string;
  catatan: string;
  status: 'terkirim' | 'dibaca' | 'diverifikasi' | 'ditolak';
  tanggal_kirim: string;
  tanggal_verifikasi: string | null;
  diverifikasi_oleh: string | null;
  alasan_tolak: string | null;
}

export interface SuratKeluar {
  id_surat_keluar: string;
  nik_penerima: string;
  nama_penerima: string;
  nomor_surat: string;
  perihal: string;
  file_url: string;
  file_name: string;
  qr_code_url: string;
  tanggal_kirim: string;
  status: 'terkirim' | 'dibaca' | 'selesai';
}

export interface Kategori {
  id_kategori: number;
  nama_kategori: string;
  deskripsi: string;
}

export interface LogAktivitas {
  id_log: string;
  user_id: string;
  nama_user: string;
  user_type: 'user' | 'warga';
  aktivitas: string;
  detail: string;
  ip_address: string;
  tanggal_waktu: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  user: User | Warga | null;
  userType: 'user' | 'warga' | null;
  token: string | null;
}
