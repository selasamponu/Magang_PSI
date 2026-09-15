import { useState } from 'react';
import { registerWarga } from '../store/auth';

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
    if (!form.nama_lengkap || !form.alamat || !form.rt || !form.rw || !form.no_hp) { setError('Semua field harus diisi!'); return; }

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
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Background Coklat Solid */}
      <div className="absolute inset-0 bg-[#8B3A1A]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7C2D12]/50 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#A0522D]/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white/20 rounded-full"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 13) % 100}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-lg relative z-10 py-8">
        <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-black/40 animate-scale-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-4 rounded-3xl bg-white shadow-xl animate-float overflow-hidden p-2 border-2 border-amber-100">
              <img 
                src="/logo.png" 
                alt="Logo Kemantren" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Registrasi Warga</h1>
            <p className="text-gray-600 mt-1 text-sm">Kemantren Tegalrejo Yogyakarta</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                NIK <span className="text-gray-500 font-normal">(16 digit)</span>
              </label>
              <input
                type="text"
                name="nik"
                value={form.nik}
                onChange={handleChange}
                maxLength={16}
                className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B3A1A] focus:border-[#8B3A1A] focus:bg-white transition-all"
                placeholder="32xxxxxxxxxxxxxx"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Nama Lengkap</label>
              <input
                type="text"
                name="nama_lengkap"
                value={form.nama_lengkap}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B3A1A] focus:border-[#8B3A1A] focus:bg-white transition-all"
                placeholder="Nama lengkap Anda"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Alamat</label>
              <textarea
                name="alamat"
                value={form.alamat}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B3A1A] focus:border-[#8B3A1A] focus:bg-white transition-all resize-none"
                placeholder="Alamat lengkap"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">RT</label>
                <input
                  type="text"
                  name="rt"
                  value={form.rt}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B3A1A] focus:border-[#8B3A1A] focus:bg-white transition-all"
                  placeholder="001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">RW</label>
                <input
                  type="text"
                  name="rw"
                  value={form.rw}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B3A1A] focus:border-[#8B3A1A] focus:bg-white transition-all"
                  placeholder="002"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">No HP</label>
              <input
                type="tel"
                name="no_hp"
                value={form.no_hp}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B3A1A] focus:border-[#8B3A1A] focus:bg-white transition-all"
                placeholder="08xxxxxxxxxx"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Password <span className="text-gray-500 font-normal">(min 6 karakter)</span>
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B3A1A] focus:border-[#8B3A1A] focus:bg-white transition-all"
                placeholder="Password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Konfirmasi Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B3A1A] focus:border-[#8B3A1A] focus:bg-white transition-all"
                placeholder="Ulangi password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-700 text-sm text-center animate-in flex items-center justify-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-green-700 text-sm text-center animate-in flex items-center justify-center gap-2">
                <span>✅</span> {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#8B3A1A] via-[#A0522D] to-[#8B3A1A] bg-[length:200%_100%] text-white font-bold rounded-2xl hover:bg-[position:100%_0] transition-all duration-500 disabled:opacity-50 shadow-lg shadow-[#8B3A1A]/50 hover:shadow-[#8B3A1A]/70 btn-ripple"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memproses...
                </span>
              ) : '📝 Daftar Sekarang'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Sudah punya akun?{' '}
              <button
                onClick={onGoLogin}
                className="text-[#8B3A1A] font-semibold hover:underline transition-all"
              >
                Login di sini
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-white/80 text-xs mt-6">
          © 2026 Kemantren Tegalrejo Yogyakarta
        </p>
      </div>
    </div>
  );
}