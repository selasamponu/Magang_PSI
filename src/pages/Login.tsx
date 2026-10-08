import { useState, useEffect } from 'react';
import { login } from '../store/auth';
import { SettingsDB } from '../store/db';

interface LoginProps {
  onLoginSuccess: () => void;
  onGoRegister: () => void;
}

export default function Login({ onLoginSuccess, onGoRegister }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [appName, setAppName] = useState('Aplikasi Surat');
  const [appInstansi, setAppInstansi] = useState('Kemantren Tegalrejo Yogyakarta');

  // Load logo & nama aplikasi dari database
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
          if (data.nama_aplikasi) setAppName(data.nama_aplikasi);
          if (data.nama_instansi) setAppInstansi(data.nama_instansi);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.message);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
      setLoading(false);
    }
  };

  return (
    /* ✅ BACKGROUND KUNING SOFT */
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 via-amber-100 to-yellow-300">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-300/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-300/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-200/50 rounded-full blur-3xl" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-amber-500/40 rounded-full"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 13) % 100}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* ============================================================ */}
        {/* ✅ CARD HITAM (yang tadinya putih)                            */}
        {/* ============================================================ */}
        <div className="bg-gray-900 rounded-3xl p-8 shadow-2xl shadow-black/50 animate-scale-in border border-gray-700/50">

          {/* Logo & Nama Aplikasi */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-4 animate-float">
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

            {/* JUDUL DENGAN GRADIENT COKLAT → EMAS */}
            <h1
              className="text-2xl font-bold tracking-tight"
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
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username / NIK */}
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                Username / NIK <span className="text-red-400">*</span>
              </label>
              <div className="relative group">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  /* ✅ INPUT TETAP ABU-ABU KEBIRUAN (SESUAI REQUEST) */
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border-2 border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all"
                  placeholder="Masukkan username atau NIK"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Username untuk petugas, NIK untuk warga</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative group">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  /* ✅ INPUT TETAP ABU-ABU KEBIRUAN (SESUAI REQUEST) */
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-100 border-2 border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all"
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-400 transition-colors text-lg"
                  title={showPass ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/40 rounded-2xl p-4 text-red-300 text-sm text-center animate-in flex items-center justify-center gap-2">
                <span>⚠️</span> {error}
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
                <>🔐 Login</>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={onGoRegister}
                className="text-amber-400 font-semibold hover:text-amber-300 hover:underline transition-all"
              >
                Daftar di sini
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