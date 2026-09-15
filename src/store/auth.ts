// src/store/auth.ts
import { User, Warga } from '../types';
import { authApi } from '../api/suratApi';

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

export async function login(
  usernameOrNik: string, 
  password: string
): Promise<{ success: boolean; message: string; user?: User | Warga; userType?: 'user' | 'warga' }> {
  try {
    const response = await authApi.login(usernameOrNik, password);

    if (!response.success) {
      return { success: false, message: response.error || 'Login gagal!' };
    }

    const user = response.user;
    const userType = response.userType;

    // Simpan session
    setAuth({
      isLoggedIn: true,
      user,
      userType,
      token: null, // Untuk sekarang tidak pakai token JWT
    });

    return { 
      success: true, 
      message: 'Login berhasil', 
      user, 
      userType 
    };
  } catch (err: any) {
    return { 
      success: false, 
      message: err.message || 'Koneksi ke server gagal!' 
    };
  }
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export async function registerWarga(data: {
  nik: string;
  nama_lengkap: string;
  alamat: string;
  rt: string;
  rw: string;
  no_hp: string;
  password: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const response = await authApi.register(data);
    if (response.success) {
      return { success: true, message: 'Registrasi berhasil! Silakan login.' };
    }
    return { success: false, message: response.error || 'Registrasi gagal!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Koneksi ke server gagal!' };
  }
}