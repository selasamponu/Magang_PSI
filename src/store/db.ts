// src/store/db.ts
import { User, Warga, SuratMasuk, SuratKeluar, Kategori, LogAktivitas } from '../types';
import {
  suratMasukApi,
  suratKeluarApi,
  wargaApi,
  usersApi,
  kategoriApi,
  logApi,
  dashboardApi,
  pengaturanApi,
} from '../api/suratApi';

export function initDB() {
  console.log('✅ initDB: Menggunakan API, bukan localStorage');
}

// ================================================================
// USERS
// ================================================================
export const UserDB = {
  getAll: async (): Promise<User[]> => {
    try {
      return await usersApi.getAll();
    } catch {
      return [];
    }
  },

  getById: async (id: number): Promise<User | undefined> => {
    const users = await usersApi.getAll();
    return users.find((u: User) => u.id === id);
  },

  create: async (user: Omit<User, 'id' | 'tanggal_daftar'>): Promise<any> => {
    return await usersApi.create(user);
  },

  update: async (id: number, data: Partial<User>): Promise<any> => {
    return await usersApi.update(id, data);
  },

  delete: async (id: number): Promise<any> => {
    return await usersApi.delete(id);
  },
};

// ================================================================
// WARGA
// ================================================================
export const WargaDB = {
  getAll: async (): Promise<Warga[]> => {
    try {
      return await wargaApi.getAll();
    } catch {
      return [];
    }
  },

  getByNik: async (nik: string): Promise<Warga | undefined> => {
    const list = await wargaApi.getAll();
    return list.find((w: Warga) => w.nik === nik);
  },

  create: async (warga: Warga): Promise<any> => {
    return await wargaApi.create(warga);
  },

  update: async (nik: string, data: Partial<Warga>): Promise<any> => {
    return await wargaApi.update(nik, data);
  },

  delete: async (nik: string): Promise<any> => {
    return await wargaApi.delete(nik);
  },

  updateStatus: async (nik: string, status: 'aktif' | 'nonaktif'): Promise<any> => {
    return await wargaApi.update(nik, { status });
  },
};

// ================================================================
// SURAT MASUK
// ================================================================
export const SuratMasukDB = {
  getAll: async (): Promise<SuratMasuk[]> => {
    try {
      return await suratMasukApi.getAll();
    } catch {
      return [];
    }
  },

  getById: async (id: string): Promise<SuratMasuk | undefined> => {
    const list = await suratMasukApi.getAll();
    return list.find((s: SuratMasuk) => s.id_surat === id);
  },

  getByNik: async (nik: string): Promise<SuratMasuk[]> => {
    const list = await suratMasukApi.getAll();
    return list.filter((s: SuratMasuk) => s.nik_pengirim === nik);
  },

  create: async (surat: any, file: File): Promise<any> => {
    return await suratMasukApi.create(surat, file);
  },

  updateStatus: async (
    id: string,
    status: SuratMasuk['status'],
    extra?: { diverifikasi_oleh?: string; alasan_tolak?: string }
  ): Promise<any> => {
    return await suratMasukApi.updateStatus(id, status, extra);
  },

  delete: async (id: string): Promise<any> => {
    return await suratMasukApi.delete(id);
  },

  generateId: (): string => {
    const now = new Date();
    const dateStr =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SRT-${dateStr}-${random}`;
  },
};

// ================================================================
// SURAT KELUAR
// ================================================================
export const SuratKeluarDB = {
  getAll: async (): Promise<SuratKeluar[]> => {
    try {
      return await suratKeluarApi.getAll();
    } catch {
      return [];
    }
  },

  getById: async (id: string): Promise<SuratKeluar | undefined> => {
    const list = await suratKeluarApi.getAll();
    return list.find((s: SuratKeluar) => s.id_surat_keluar === id);
  },

  create: async (surat: any, file: File): Promise<any> => {
    return await suratKeluarApi.create(surat, file);
  },

  update: async (id: string, data: any, file?: File): Promise<any> => {
    return await suratKeluarApi.update(id, data, file);
  },

  updateStatus: async (id: string, status: 'terkirim' | 'dibaca' | 'selesai'): Promise<any> => {
    return await suratKeluarApi.updateStatus(id, status);
  },

  delete: async (id: string): Promise<any> => {
    return await suratKeluarApi.delete(id);
  },

  generateId: (): string => {
    const now = new Date();
    const dateStr =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SK-${dateStr}-${random}`;
  },
};

// ================================================================
// PENGATURAN APLIKASI
// ================================================================
export const SettingsDB = {
  get: async (): Promise<any> => {
    try {
      return await pengaturanApi.get();
    } catch {
      return null;
    }
  },

  update: async (data: any, file?: File): Promise<any> => {
    return await pengaturanApi.update(data, file);
  },
};

// ================================================================
// KATEGORI
// ================================================================
export const KategoriDB = {
  getAll: async (): Promise<Kategori[]> => {
    try {
      return await kategoriApi.getAll();
    } catch {
      return [];
    }
  },
};

// ================================================================
// LOG AKTIVITAS
// ================================================================
export const LogDB = {
  getAll: async (): Promise<LogAktivitas[]> => {
    try {
      return await logApi.getAll();
    } catch {
      return [];
    }
  },

  create: async (log: Omit<LogAktivitas, 'id_log' | 'tanggal_waktu' | 'ip_address'>): Promise<any> => {
    const logData = {
      id_log: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ...log,
    };
    return await logApi.create(logData);
  },

  getByUser: async (userId: string): Promise<LogAktivitas[]> => {
    const logs = await logApi.getAll();
    return logs.filter((l: LogAktivitas) => l.user_id === userId);
  },
};

// ================================================================
// DASHBOARD STATS
// ================================================================
export async function getDashboardStats(
  userType: 'user' | 'warga',
  userId?: string
): Promise<any> {
  try {
    return await dashboardApi.getStats(userType, userId);
  } catch {
    return {
      totalSuratMasuk: 0,
      menungguVerifikasi: 0,
      diverifikasi: 0,
      ditolak: 0,
      totalWarga: 0,
      totalUser: 0,
      totalSurat: 0,
      menunggu: 0,
    };
  }
}