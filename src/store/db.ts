import { User, Warga, SuratMasuk, SuratKeluar, Kategori, LogAktivitas } from '../types';

const DB_KEYS = {
  users: 'surat_app_users',
  warga: 'surat_app_warga',
  suratMasuk: 'surat_app_surat_masuk',
  suratKeluar: 'surat_app_surat_keluar',
  kategori: 'surat_app_kategori',
  log: 'surat_app_log',
  initialized: 'surat_app_initialized',
};

const defaultKategori: Kategori[] = [
  { id_kategori: 1, nama_kategori: 'Surat Undangan', deskripsi: 'Surat undangan resmi' },
  { id_kategori: 2, nama_kategori: 'Surat Pernyataan', deskripsi: 'Surat pernyataan resmi' },
  { id_kategori: 3, nama_kategori: 'Surat Keterangan', deskripsi: 'Surat keterangan resmi' },
  { id_kategori: 4, nama_kategori: 'Surat Rekomendasi', deskripsi: 'Surat rekomendasi resmi' },
  { id_kategori: 5, nama_kategori: 'Surat Permohonan', deskripsi: 'Surat permohonan resmi' },
  { id_kategori: 6, nama_kategori: 'Surat Pemberitahuan', deskripsi: 'Surat pemberitahuan resmi' },
  { id_kategori: 7, nama_kategori: 'Surat Pengaduan', deskripsi: 'Surat pengaduan resmi' },
  { id_kategori: 8, nama_kategori: 'Surat Izin', deskripsi: 'Surat izin resmi' },
  { id_kategori: 9, nama_kategori: 'Surat Lainnya', deskripsi: 'Surat lainnya' },
];

const defaultUsers: User[] = [
  {
    id: 1,
    nama: 'Administrator',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    status: 'aktif',
    tanggal_daftar: new Date().toISOString(),
  },
  {
    id: 2,
    nama: 'Operator',
    username: 'operator',
    password: 'operator123',
    role: 'operator',
    status: 'aktif',
    tanggal_daftar: new Date().toISOString(),
  },
];

export function initDB() {
  if (!localStorage.getItem(DB_KEYS.initialized)) {
    localStorage.setItem(DB_KEYS.users, JSON.stringify(defaultUsers));
    localStorage.setItem(DB_KEYS.warga, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.suratMasuk, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.suratKeluar, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.kategori, JSON.stringify(defaultKategori));
    localStorage.setItem(DB_KEYS.log, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.initialized, 'true');
  }
}

// Generic CRUD operations
function getAll<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveAll<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Users
export const UserDB = {
  getAll: (): User[] => getAll<User>(DB_KEYS.users),
  getById: (id: number): User | undefined => getAll<User>(DB_KEYS.users).find(u => u.id === id),
  getByUsername: (username: string): User | undefined => getAll<User>(DB_KEYS.users).find(u => u.username === username),
  create: (user: Omit<User, 'id' | 'tanggal_daftar'>): User => {
    const users = getAll<User>(DB_KEYS.users);
    const newUser: User = { ...user, id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1, tanggal_daftar: new Date().toISOString() };
    users.push(newUser);
    saveAll(DB_KEYS.users, users);
    return newUser;
  },
  update: (id: number, data: Partial<User>): User | undefined => {
    const users = getAll<User>(DB_KEYS.users);
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    users[idx] = { ...users[idx], ...data };
    saveAll(DB_KEYS.users, users);
    return users[idx];
  },
  delete: (id: number): boolean => {
    const users = getAll<User>(DB_KEYS.users);
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    saveAll(DB_KEYS.users, filtered);
    return true;
  },
  login: (username: string, password: string): User | null => {
    const user = getAll<User>(DB_KEYS.users).find(u => u.username === username && u.password === password && u.status === 'aktif');
    return user || null;
  },
};

// Warga
export const WargaDB = {
  getAll: (): Warga[] => getAll<Warga>(DB_KEYS.warga),
  getByNik: (nik: string): Warga | undefined => getAll<Warga>(DB_KEYS.warga).find(w => w.nik === nik),
  create: (warga: Warga): Warga => {
    const wargaList = getAll<Warga>(DB_KEYS.warga);
    wargaList.push(warga);
    saveAll(DB_KEYS.warga, wargaList);
    return warga;
  },
  update: (nik: string, data: Partial<Warga>): Warga | undefined => {
    const wargaList = getAll<Warga>(DB_KEYS.warga);
    const idx = wargaList.findIndex(w => w.nik === nik);
    if (idx === -1) return undefined;
    wargaList[idx] = { ...wargaList[idx], ...data };
    saveAll(DB_KEYS.warga, wargaList);
    return wargaList[idx];
  },
  delete: (nik: string): boolean => {
    const wargaList = getAll<Warga>(DB_KEYS.warga);
    const filtered = wargaList.filter(w => w.nik !== nik);
    if (filtered.length === wargaList.length) return false;
    saveAll(DB_KEYS.warga, filtered);
    return true;
  },
  login: (nik: string, password: string): Warga | null => {
    const warga = getAll<Warga>(DB_KEYS.warga).find(w => w.nik === nik && w.password === password && w.status === 'aktif');
    return warga || null;
  },
  updateStatus: (nik: string, status: 'aktif' | 'nonaktif'): Warga | undefined => {
    return WargaDB.update(nik, { status });
  },
};

// Surat Masuk
export const SuratMasukDB = {
  getAll: (): SuratMasuk[] => getAll<SuratMasuk>(DB_KEYS.suratMasuk),
  getById: (id: string): SuratMasuk | undefined => getAll<SuratMasuk>(DB_KEYS.suratMasuk).find(s => s.id_surat === id),
  getByNik: (nik: string): SuratMasuk[] => getAll<SuratMasuk>(DB_KEYS.suratMasuk).filter(s => s.nik_pengirim === nik),
  create: (surat: SuratMasuk): SuratMasuk => {
    const list = getAll<SuratMasuk>(DB_KEYS.suratMasuk);
    list.push(surat);
    saveAll(DB_KEYS.suratMasuk, list);
    return surat;
  },
  updateStatus: (id: string, status: SuratMasuk['status'], extra?: { diverifikasi_oleh?: string; alasan_tolak?: string }): SuratMasuk | undefined => {
    const list = getAll<SuratMasuk>(DB_KEYS.suratMasuk);
    const idx = list.findIndex(s => s.id_surat === id);
    if (idx === -1) return undefined;
    list[idx] = {
      ...list[idx],
      status,
      tanggal_verifikasi: status === 'diverifikasi' || status === 'ditolak' ? new Date().toISOString() : list[idx].tanggal_verifikasi,
      diverifikasi_oleh: extra?.diverifikasi_oleh || list[idx].diverifikasi_oleh,
      alasan_tolak: extra?.alasan_tolak || list[idx].alasan_tolak,
    };
    saveAll(DB_KEYS.suratMasuk, list);
    return list[idx];
  },
  generateId: (): string => {
    const now = new Date();
    const dateStr = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0');
    const list = getAll<SuratMasuk>(DB_KEYS.suratMasuk);
    const todaySurat = list.filter(s => s.id_surat.includes(dateStr));
    const nextNum = (todaySurat.length + 1).toString().padStart(3, '0');
    return `SRT-${dateStr}-${nextNum}`;
  },
};

// Surat Keluar
export const SuratKeluarDB = {
  getAll: (): SuratKeluar[] => getAll<SuratKeluar>(DB_KEYS.suratKeluar),
  getById: (id: string): SuratKeluar | undefined => getAll<SuratKeluar>(DB_KEYS.suratKeluar).find(s => s.id_surat_keluar === id),
  create: (surat: SuratKeluar): SuratKeluar => {
    const list = getAll<SuratKeluar>(DB_KEYS.suratKeluar);
    list.push(surat);
    saveAll(DB_KEYS.suratKeluar, list);
    return surat;
  },
  generateId: (): string => {
    const now = new Date();
    const dateStr = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0');
    const list = getAll<SuratKeluar>(DB_KEYS.suratKeluar);
    const todaySurat = list.filter(s => s.id_surat_keluar.includes(dateStr));
    const nextNum = (todaySurat.length + 1).toString().padStart(3, '0');
    return `SK-${dateStr}-${nextNum}`;
  },
};

// Kategori
export const KategoriDB = {
  getAll: (): Kategori[] => getAll<Kategori>(DB_KEYS.kategori),
};

// Log
export const LogDB = {
  getAll: (): LogAktivitas[] => getAll<LogAktivitas>(DB_KEYS.log),
  create: (log: Omit<LogAktivitas, 'id_log' | 'tanggal_waktu' | 'ip_address'>): LogAktivitas => {
    const list = getAll<LogAktivitas>(DB_KEYS.log);
    const newLog: LogAktivitas = {
      ...log,
      id_log: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      tanggal_waktu: new Date().toISOString(),
      ip_address: '127.0.0.1',
    };
    list.unshift(newLog);
    // Keep only last 500 logs
    if (list.length > 500) list.length = 500;
    saveAll(DB_KEYS.log, list);
    return newLog;
  },
  getByUser: (userId: string): LogAktivitas[] => getAll<LogAktivitas>(DB_KEYS.log).filter(l => l.user_id === userId),
};

// Dashboard Stats
export function getDashboardStats(userType: 'user' | 'warga', userId?: string) {
  const suratMasuk = SuratMasukDB.getAll();
  const suratKeluar = SuratKeluarDB.getAll();
  const warga = WargaDB.getAll();
  const users = UserDB.getAll();

  if (userType === 'warga' && userId) {
    const mySurat = suratMasuk.filter(s => s.nik_pengirim === userId);
    return {
      totalSurat: mySurat.length,
      menunggu: mySurat.filter(s => s.status === 'terkirim' || s.status === 'dibaca').length,
      diverifikasi: mySurat.filter(s => s.status === 'diverifikasi').length,
      ditolak: mySurat.filter(s => s.status === 'ditolak').length,
    };
  }

  return {
    totalSuratMasuk: suratMasuk.length,
    menungguVerifikasi: suratMasuk.filter(s => s.status === 'terkirim' || s.status === 'dibaca').length,
    diverifikasi: suratMasuk.filter(s => s.status === 'diverifikasi').length,
    ditolak: suratMasuk.filter(s => s.status === 'ditolak').length,
    totalWarga: warga.length,
    totalUser: users.length,
    totalSuratKeluar: suratKeluar.length,
  };
}
