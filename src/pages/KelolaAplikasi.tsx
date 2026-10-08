import { useState, useEffect, useRef } from 'react';
import { SettingsDB, LogDB } from '../store/db';
import { User } from '../types';

interface Props {
  currentUser: User;
}

export default function KelolaAplikasi({ currentUser }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nama_aplikasi: 'Aplikasi Surat',
    nama_instansi: 'Kemantren Tegalrejo',
    warna_tema: '#8B3A1A',
    logo_url: '',
    favicon_url: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const presetColors = [
    { name: 'Coklat', value: '#8B3A1A' },
    { name: 'Merah', value: '#DC2626' },
    { name: 'Biru', value: '#2563EB' },
    { name: 'Hijau', value: '#16A34A' },
    { name: 'Ungu', value: '#9333EA' },
    { name: 'Orange', value: '#EA580C' },
    { name: 'Teal', value: '#0D9488' },
    { name: 'Pink', value: '#DB2777' },
    { name: 'Indigo', value: '#4F46E5' },
    { name: 'Hitam', value: '#1F2937' },
  ];

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await SettingsDB.get();
      if (data) {
        setForm({
          nama_aplikasi: data.nama_aplikasi || 'Aplikasi Surat',
          nama_instansi: data.nama_instansi || 'Kemantren Tegalrejo',
          warna_tema: data.warna_tema || '#8B3A1A',
          logo_url: data.logo_url || '',
          favicon_url: data.favicon_url || '',
        });
        if (data.logo_url) {
          setLogoPreview(
            data.logo_url.startsWith('/uploads/')
              ? `http://${window.location.hostname}:5000${data.logo_url}`
              : data.logo_url
          );
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran logo maksimal 2MB!');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (PNG/JPG/SVG)!');
      return;
    }
    setLogoFile(file);
    setError('');

    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await SettingsDB.update(
        {
          nama_aplikasi: form.nama_aplikasi,
          nama_instansi: form.nama_instansi,
          warna_tema: form.warna_tema,
          logo_url: form.logo_url,
          favicon_url: form.favicon_url,
        },
        logoFile || undefined
      );

      await LogDB.create({
        user_id: currentUser.username,
        nama_user: currentUser.nama,
        user_type: 'user',
        aktivitas: 'UPDATE_PENGATURAN',
        detail: `Update pengaturan aplikasi`,
      });

      setSuccess('Pengaturan berhasil disimpan! Refresh halaman untuk melihat perubahan.');
      setLogoFile(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
      await refresh();

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset ke default? Logo & nama aplikasi akan dikembalikan ke semula.')) {
      setForm({
        nama_aplikasi: 'Aplikasi Surat',
        nama_instansi: 'Kemantren Tegalrejo',
        warna_tema: '#8B3A1A',
        logo_url: '',
        favicon_url: '',
      });
      setLogoFile(null);
      setLogoPreview('');
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">⚙️ Pengaturan Aplikasi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola logo, nama aplikasi, dan warna tema
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="w-full sm:w-auto px-5 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============================================================ */}
        {/* KOLOM KIRI — PREVIEW (STICKY)                                 */}
        {/* ============================================================ */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sticky top-4 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span>👁️</span> Preview
            </h3>

            {/* Preview Sidebar */}
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ backgroundColor: form.warna_tema }}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center p-1.5 flex-shrink-0 shadow-md">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xl">📬</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-white leading-tight truncate">
                    {form.nama_aplikasi || 'Aplikasi Surat'}
                  </h4>
                  <p className="text-xs text-white/80 leading-tight truncate">
                    {form.nama_instansi || 'Kemantren'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tombol Contoh */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-semibold">Tombol dengan warna tema:</p>
              <button
                type="button"
                className="w-full py-3 text-white rounded-xl text-sm font-semibold shadow-lg transition-all hover:opacity-90"
                style={{ backgroundColor: form.warna_tema }}
              >
                📤 Tombol Contoh
              </button>
            </div>

            {/* Tips */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs text-blue-700 leading-relaxed">
                💡 <strong>Tips:</strong> Gunakan logo dengan background transparan (PNG/SVG) untuk hasil terbaik.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* KOLOM KANAN — FORM                                            */}
        {/* ============================================================ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logo Aplikasi */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🖼️</span> Logo Aplikasi
            </h3>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-28 h-28 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-dashed border-amber-200 flex items-center justify-center p-3 flex-shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center">
                    <div className="text-3xl mb-1">📬</div>
                    <p className="text-xs text-gray-400">Belum ada logo</p>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                >
                  📁 Pilih Logo Baru
                </button>
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-gray-500">
                    Format: PNG, JPG, SVG • Max 2MB • Rekomendasi 512x512 px
                  </p>
                  <p className="text-xs text-blue-600">
                    💡 Logo akan otomatis jadi favicon & PWA icon
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Informasi Aplikasi */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span>📝</span> Informasi Aplikasi
            </h3>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span>📱</span>
                Nama Aplikasi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nama_aplikasi}
                onChange={(e) => setForm({ ...form, nama_aplikasi: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Aplikasi Surat Eksternal"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Nama ini tampil di sidebar & title browser</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span>🏛️</span>
                Nama Instansi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nama_instansi}
                onChange={(e) => setForm({ ...form, nama_instansi: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Kemantren Tegalrejo Yogyakarta"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Nama ini tampil di bawah nama aplikasi</p>
            </div>
          </div>

          {/* Warna Tema */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span>🎨</span> Warna Tema
            </h3>

            {/* Preset Colors — KECIL */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-3">Pilih Warna Cepat</p>
              <div className="flex flex-wrap gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setForm({ ...form, warna_tema: color.value })}
                    className={`w-10 h-10 rounded-lg transition-all hover:scale-110 ${
                      form.warna_tema === color.value
                        ? 'ring-2 ring-offset-2 ring-purple-500 scale-110'
                        : 'ring-1 ring-gray-200'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Custom Color */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span>🎨</span>
                Warna Custom
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={form.warna_tema}
                  onChange={(e) => setForm({ ...form, warna_tema: e.target.value })}
                  className="w-14 h-12 rounded-xl border border-gray-200 cursor-pointer flex-shrink-0"
                />
                <input
                  type="text"
                  value={form.warna_tema}
                  onChange={(e) => setForm({ ...form, warna_tema: e.target.value })}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="#8B3A1A"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-green-700 text-sm flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span>{success}</span>
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              🔄 Reset Default
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>💾 Simpan Pengaturan</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}