import { User, Warga } from '../types';
import { UserDB, WargaDB, LogDB } from './db';

export interface AuthState {
  isLoggedIn: boolean;
  user: User | Warga | null;
  userType: 'user' | 'warga' | null;
  token: string | null;
}

const AUTH_KEY = 'surat_app_auth';

export function getAuth(): AuthState {
  const data = localStorage.getItem(AUTH_KEY);
  if (!data) return { isLoggedIn: false, user: null, userType: null, token: null };
  return JSON.parse(data);
}

export function setAuth(state: AuthState) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export function login(usernameOrNik: string, password: string): { success: boolean; message: string; user?: User | Warga; userType?: 'user' | 'warga' } {
  // IMPORTANT: Check User (Admin/Operator) FIRST, then Warga
  let user = UserDB.login(usernameOrNik, password);
  if (user) {
    const token = btoa(JSON.stringify({ id: user.id, role: user.role, type: 'user', exp: Date.now() + 6 * 60 * 60 * 1000 }));
    setAuth({ isLoggedIn: true, user, userType: 'user', token });
    LogDB.create({ user_id: user.username, nama_user: user.nama, user_type: 'user', aktivitas: 'LOGIN', detail: 'Login berhasil sebagai ' + user.role });
    return { success: true, message: 'Login berhasil', user, userType: 'user' };
  }

  // Then check Warga
  const warga = WargaDB.login(usernameOrNik, password);
  if (warga) {
    const token = btoa(JSON.stringify({ nik: warga.nik, type: 'warga', exp: Date.now() + 6 * 60 * 60 * 1000 }));
    WargaDB.update(warga.nik, { terakhir_login: new Date().toISOString() });
    setAuth({ isLoggedIn: true, user: warga, userType: 'warga', token });
    LogDB.create({ user_id: warga.nik, nama_user: warga.nama_lengkap, user_type: 'warga', aktivitas: 'LOGIN', detail: 'Login berhasil sebagai warga' });
    return { success: true, message: 'Login berhasil', user: warga, userType: 'warga' };
  }

  return { success: false, message: 'Username/NIK atau password salah!' };
}

export function logout() {
  const auth = getAuth();
  if (auth.user) {
    if (auth.userType === 'user') {
      const u = auth.user as User;
      LogDB.create({ user_id: u.username, nama_user: u.nama, user_type: 'user', aktivitas: 'LOGOUT', detail: 'Logout berhasil' });
    } else {
      const w = auth.user as Warga;
      LogDB.create({ user_id: w.nik, nama_user: w.nama_lengkap, user_type: 'warga', aktivitas: 'LOGOUT', detail: 'Logout berhasil' });
    }
  }
  localStorage.removeItem(AUTH_KEY);
}

export function registerWarga(data: { nik: string; nama_lengkap: string; alamat: string; rt: string; rw: string; no_hp: string; password: string }): { success: boolean; message: string } {
  const existing = WargaDB.getByNik(data.nik);
  if (existing) return { success: false, message: 'NIK sudah terdaftar!' };

  WargaDB.create({
    ...data,
    status: 'aktif',
    tanggal_daftar: new Date().toISOString(),
    terakhir_login: null,
  });

  LogDB.create({ user_id: data.nik, nama_user: data.nama_lengkap, user_type: 'warga', aktivitas: 'REGISTER', detail: 'Registrasi warga baru' });
  return { success: true, message: 'Registrasi berhasil! Silakan login.' };
}
