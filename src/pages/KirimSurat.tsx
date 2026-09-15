import { useState, useEffect, useRef } from 'react';
import { SuratMasukDB, KategoriDB, LogDB } from '../store/db';
import { Warga, Kategori } from '../types';

interface Props {
  warga: Warga;
  onNavigate: (page: string) => void;
}

export default function KirimSurat({ warga, onNavigate }: Props) {
  const [metode, setMetode] = useState<'scan' | 'upload'>('upload');
  const [kategori, setKategori] = useState('');
  const [perihal, setPerihal] = useState('');
  const [catatan, setCatatan] = useState('');
  const [fileData, setFileData] = useState<string>('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadKategori = async () => {
      try {
        const data = await KategoriDB.getAll();
        setKategoriList(data);
      } catch (err) {
        console.error('Error loading kategori:', err);
      }
    };
    loadKategori();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Ukuran file maksimal 5MB!'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as string);
      setFileName(file.name);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fileData) { setError('File harus diupload!'); return; }
    if (!kategori) { setError('Kategori harus dipilih!'); return; }
    if (!perihal.trim()) { setError('Perihal harus diisi!'); return; }

    setLoading(true);
    try {
      const id = SuratMasukDB.generateId();
      await SuratMasukDB.create({
        id_surat: id,
        nik_pengirim: warga.nik,
        nama_pengirim: warga.nama_lengkap,
        metode,
        kategori,
        perihal,
        file_url: fileData,
        file_name: fileName,
        catatan,
        status: 'terkirim',
        tanggal_kirim: new Date().toISOString(),
        tanggal_verifikasi: null,
        diverifikasi_oleh: null,
        alasan_tolak: null,
      });
      await LogDB.create({
        user_id: warga.nik,
        nama_user: warga.nama_lengkap,
        user_type: 'warga',
        aktivitas: 'KIRIM_SURAT',
        detail: `Kirim surat ${id} - ${perihal}`,
      });
      setSuccess(`Surat berhasil dikirim! ID: ${id}`);
      setFileData('');
      setFileName('');
      setPerihal('');
      setCatatan('');
      setKategori('');
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim surat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">📝 Kirim Surat</h1>
        <p className="text-sm text-gray-500 mt-1">Kirim surat ke Kemantren Tegalrejo</p>
      </div>

      {/* Metode Selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setMetode('scan')}
          className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 hover-scale ${
            metode === 'scan' 
              ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg shadow-purple-500/20' 
              : 'border-gray-200 hover:border-purple-300 bg-white'
          }`}
        >
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-3 transition-all ${
            metode === 'scan' ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30' : 'bg-gray-100'
          }`}>
            📷
          </div>
          <p className={`font-semibold ${metode === 'scan' ? 'text-purple-700' : 'text-gray-700'}`}>Scan Surat Fisik</p>
          <p className="text-xs text-gray-500 mt-1">Foto surat kertas</p>
        </button>
        <button
          type="button"
          onClick={() => setMetode('upload')}
          className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 hover-scale ${
            metode === 'upload' 
              ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg shadow-purple-500/20' 
              : 'border-gray-200 hover:border-purple-300 bg-white'
          }`}
        >
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-3 transition-all ${
            metode === 'upload' ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30' : 'bg-gray-100'
          }`}>
            📤
          </div>
          <p className={`font-semibold ${metode === 'upload' ? 'text-purple-700' : 'text-gray-700'}`}>Upload File</p>
          <p className="text-xs text-gray-500 mt-1">PDF/DOC/JPG/PNG</p>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-5">
        {/* Upload File */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Upload File <span className="text-gray-400 font-normal">(max 5MB)</span>
          </label>
          {metode === 'scan' ? (
            <div>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
              <button 
                type="button" 
                onClick={() => cameraInputRef.current?.click()} 
                className="w-full py-10 border-2 border-dashed border-gray-300 rounded-2xl text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all group"
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📷</div>
                <p className="text-sm font-semibold text-gray-700">{fileName || 'Klik untuk mengambil foto'}</p>
                <p className="text-xs text-gray-400 mt-1">Ambil foto surat fisik</p>
              </button>
            </div>
          ) : (
            <div>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileChange} className="hidden" />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="w-full py-10 border-2 border-dashed border-gray-300 rounded-2xl text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all group"
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📁</div>
                <p className="text-sm font-semibold text-gray-700">{fileName || 'Klik untuk memilih file'}</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC, DOCX</p>
              </button>
            </div>
          )}
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori Surat</label>
          <select 
            value={kategori} 
            onChange={e => setKategori(e.target.value)} 
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all bg-white" 
            required
          >
            <option value="">-- Pilih Kategori --</option>
            {kategoriList.map(k => <option key={k.id_kategori} value={k.nama_kategori}>{k.nama_kategori}</option>)}
          </select>
        </div>

        {/* Perihal */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Perihal Surat</label>
          <input 
            type="text" 
            value={perihal} 
            onChange={e => setPerihal(e.target.value)} 
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all" 
            placeholder="Contoh: Undangan Rapat RT" 
            required 
          />
        </div>

        {/* Catatan */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Catatan <span className="text-gray-400 font-normal">(opsional)</span>
          </label>
          <textarea 
            value={catatan} 
            onChange={e => setCatatan(e.target.value)} 
            rows={3} 
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all resize-none" 
            placeholder="Tambahkan catatan..." 
          />
        </div>

        {/* Error / Success */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm flex items-center gap-2 animate-in">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm animate-in">
            <div className="flex items-center gap-2 mb-2">
              <span>✅</span> <strong>{success}</strong>
            </div>
            <button 
              onClick={() => onNavigate('riwayat-surat')} 
              className="text-green-700 underline font-semibold hover:text-green-800"
            >
              → Lihat Riwayat Surat
            </button>
          </div>
        )}

        {/* Submit */}
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] text-white font-bold rounded-2xl hover:bg-[position:100%_0] transition-all duration-500 disabled:opacity-50 shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 btn-ripple"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Mengirim...
            </span>
          ) : '📤 Kirim Surat'}
        </button>
      </form>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
        <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
          <span>💡</span> Tips
        </h3>
        <ul className="text-sm text-purple-700 space-y-1.5">
          <li>• Pastikan file surat jelas dan mudah dibaca</li>
          <li>• Ukuran file maksimal 5MB</li>
          <li>• Format: PDF, JPG, PNG, DOC, DOCX</li>
          <li>• Surat akan diverifikasi oleh petugas Kemantren</li>
        </ul>
      </div>
    </div>
  );
}