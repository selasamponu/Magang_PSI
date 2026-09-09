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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.nik.length !== 16) { setError('NIK harus 16 digit!'); return; }
    if (form.password.length < 6) { setError('Password minimal 6 karakter!'); return; }
    if (form.password !== form.confirmPassword) { setError('Konfirmasi password tidak cocok!'); return; }
    if (!form.nama_lengkap || !form.alamat || !form.rt || !form.rw || !form.no_hp) { setError('Semua field harus diisi!'); return; }

    setLoading(true);
    setTimeout(() => {
      const result = registerWarga({
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
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-4xl sm:text-5xl mb-3">📝</div>
            <h1 className="text-lg sm:text-xl font-bold text-white">Registrasi Warga</h1>
            <p className="text-purple-300 text-sm mt-1">Kemantren Tegalrejo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-purple-200 mb-1">NIK (16 digit)</label>
              <input type="text" name="nik" value={form.nik} onChange={handleChange} maxLength={16} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="32xxxxxxxxxxxxxx" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-purple-200 mb-1">Nama Lengkap</label>
              <input type="text" name="nama_lengkap" value={form.nama_lengkap} onChange={handleChange} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="Nama lengkap" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-purple-200 mb-1">Alamat</label>
              <textarea name="alamat" value={form.alamat} onChange={handleChange} rows={2} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="Alamat lengkap" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-purple-200 mb-1">RT</label>
                <input type="text" name="rt" value={form.rt} onChange={handleChange} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="001" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-200 mb-1">RW</label>
                <input type="text" name="rw" value={form.rw} onChange={handleChange} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="002" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-purple-200 mb-1">No HP</label>
              <input type="tel" name="no_hp" value={form.no_hp} onChange={handleChange} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="08xxxxxxxxxx" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-purple-200 mb-1">Password (min 6 karakter)</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="Password" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-purple-200 mb-1">Konfirmasi Password</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="Ulangi password" required />
            </div>

            {error && <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 text-red-200 text-sm text-center animate-in">⚠️ {error}</div>}
            {success && <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-3 text-green-200 text-sm text-center animate-in">✅ {success}</div>}

            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30 text-sm sm:text-base">
              {loading ? 'Memproses...' : '📝 Daftar'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-purple-300 text-sm">
              Sudah punya akun?{' '}
              <button onClick={onGoLogin} className="text-purple-200 font-semibold hover:text-white underline">Login di sini</button>
            </p>
          </div>
        </div>

        <p className="text-center text-purple-400/50 text-xs mt-4">© 2024 Kemantren Tegalrejo</p>
      </div>
    </div>
  );
}
