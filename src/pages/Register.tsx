import { useState, useEffect } from 'react';
import { registerWarga } from '../store/auth';
import { SettingsDB } from '../store/db';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onGoLogin: () => void;
}

export default function Register({ onRegisterSuccess, onGoLogin }: RegisterProps) {
  const [form, setForm] = useState({
    nik: '', nama_lengkap: '', alamat: '', rt: '', rw: '', no_hp: '', password: '', confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [appName, setAppName] = useState('Registrasi Warga');
  const [appInstansi, setAppInstansi] = useState('Kemantren Tegalrejo Yogyakarta');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await SettingsDB.get();
        if (data) {
          if (data.logo_url) {
            setLogoUrl(
              data.logo_url.startsWith('/uploads/')
                ? `http://${window.location.hostname}:5000${data.logo_url}`
                : data.logo_url
            );
          }
          if (data.nama_instansi) setAppInstansi(data.nama_instansi);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.nik.length !== 16) { setError('NIK harus 16 digit!'); return; }
    if (form.password.length < 6) { setError('Password minimal 6 karakter!'); return; }
    if (form.password !== form.confirmPassword) { setError('Konfirmasi password tidak cocok!'); return; }
    if (!form.nama_lengkap || !form.alamat || !form.rt || !form.rw || !form.no_hp) {
      setError('Semua field harus diisi!');
      return;
    }

    setLoading(true);
    try {
      const result = await registerWarga({
        nik: form.nik,
        nama_lengkap: form.nama_lengkap,
        alamat: form.alamat,
        rt: form.rt,
        rw: form.rw,
        no_hp: form.no_hp,
        password: form.password,
      });
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => onRegisterSuccess(), 1500);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* ✅ BACKGROUND KUNING SOFT — TANPA ORB & PARTICLES */
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-yellow-200 via-amber-100 to-yellow-300">

      <div className="w-full max-w-lg relative z-10 py-8">

        {/* ✅ CARD HITAM */}
        <div className="bg-gray-900 rounded-3xl p-8 shadow-2xl shadow-black/50 animate-scale-in border border-gray-700/50">

          {/* Logo & Nama Aplikasi */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-3">
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain"
                style={{ background: 'transparent', border: 'none' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>

            {/* JUDUL DENGAN GRADIENT EMAS */}
            <h1
              className="text-xl sm:text-2xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 30%, #F59E0B 60%, #D97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {appName}
            </h1>

            <p className="text-gray-400 mt-1 text-sm">{appInstansi}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* NIK */}
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                NIK <span className="text-gray-400 font-normal">(16 digit)</span>
              </label>
              <input
                type="text"
                name="nik"
                value={form.nik}
                onChange={handleChange}
                maxLength={16}
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all font-mono text-sm"
                placeholder="32xxxxxxxxxxxxxx"
                required
              />
            </div>

            {/* Nama Lengkap */}
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                Nama Lengkap <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="nama_lengkap"
                value={form.nama_lengkap}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all text-sm"
                placeholder="Nama lengkap Anda"
                required
              />
            </div>

            {/* Alamat */}
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                Alamat <span className="text-red-400">*</span>
              </label>
              <textarea
                name="alamat"
                value={form.alamat}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all resize-none text-sm"
                placeholder="Alamat lengkap"
                required
              />
            </div>

            {/* RT & RW — Grid 2 kolom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-amber-400 mb-2">
                  RT <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="rt"
                  value={form.rt}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all text-sm"
                  placeholder="001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-400 mb-2">
                  RW <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="rw"
                  value={form.rw}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all text-sm"
                  placeholder="002"
                  required
                />
              </div>
            </div>

            {/* No HP */}
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                No HP <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                name="no_hp"
                value={form.no_hp}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all text-sm"
                placeholder="08xxxxxxxxxx"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                Password <span className="text-gray-400 font-normal">(min 6 karakter)</span>
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all text-sm"
                placeholder="Password"
                required
              />
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                Konfirmasi Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all text-sm"
                placeholder="Ulangi password"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/40 rounded-2xl p-4 text-red-300 text-sm text-center animate-in flex items-center justify-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-green-500/20 border-2 border-green-500/40 rounded-2xl p-4 text-green-300 text-sm text-center animate-in flex items-center justify-center gap-2">
                <span>✅</span> {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#8B3A1A] via-[#A0522D] to-[#8B3A1A] bg-[length:200%_100%] text-white font-bold rounded-2xl hover:bg-[position:100%_0] transition-all duration-500 disabled:opacity-50 shadow-lg shadow-[#8B3A1A]/50 hover:shadow-[#8B3A1A]/70 btn-ripple flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memproses...
                </>
              ) : (
                <>📝 Daftar Sekarang</>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={onGoLogin}
                className="text-amber-400 font-semibold hover:text-amber-300 hover:underline transition-all"
              >
                Login di sini
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-amber-900 text-xs mt-6 font-medium">
          © 2026 {appInstansi}
        </p>
      </div>
    </div>
  );
}