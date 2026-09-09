import { useState } from 'react';
import { login } from '../store/auth';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(username, password);
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.message);
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 drop-shadow-lg">📬</div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Aplikasi Surat</h1>
            <p className="text-purple-300 mt-1 text-sm">Kemantren Tegalrejo</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">Username / NIK</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="Masukkan username atau NIK"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">Password</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="Masukkan password"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/50 hover:text-purple-200">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 text-red-200 text-sm text-center animate-in">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30 text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Memproses...
                </span>
              ) : '🔐 Login'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-purple-300 text-sm">
              Belum punya akun?{' '}
              <button onClick={onGoRegister} className="text-purple-200 font-semibold hover:text-white underline transition-colors">
                Daftar di sini
              </button>
            </p>
          </div>

          {/* Info */}
          <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xs text-purple-300 text-center">
              <strong>Default Login:</strong><br />
              Admin: <code className="bg-white/10 px-1 rounded">admin</code> / <code className="bg-white/10 px-1 rounded">admin123</code><br />
              Operator: <code className="bg-white/10 px-1 rounded">operator</code> / <code className="bg-white/10 px-1 rounded">operator123</code>
            </p>
          </div>
        </div>

        <p className="text-center text-purple-400/50 text-xs mt-4">© 2024 Kemantren Tegalrejo</p>
      </div>
    </div>
  );
}
