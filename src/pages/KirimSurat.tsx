import { useState, useEffect, useRef } from 'react';
import { SuratMasukDB, KategoriDB, LogDB } from '../store/db';
import { Warga } from '../types';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const kategoriList = KategoriDB.getAll();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fileData) { setError('File harus diupload!'); return; }
    if (!kategori) { setError('Kategori harus dipilih!'); return; }
    if (!perihal.trim()) { setError('Perihal harus diisi!'); return; }

    setLoading(true);
    setTimeout(() => {
      const id = SuratMasukDB.generateId();
      SuratMasukDB.create({
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
      LogDB.create({ user_id: warga.nik, nama_user: warga.nama_lengkap, user_type: 'warga', aktivitas: 'KIRIM_SURAT', detail: `Kirim surat ${id} - ${perihal}` });
      setSuccess(`Surat berhasil dikirim! ID: ${id}`);
      setFileData('');
      setFileName('');
      setPerihal('');
      setCatatan('');
      setKategori('');
      setLoading(false);
    }, 800);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">📝 Kirim Surat</h1>

      {/* Metode Selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setMetode('scan')}
          className={`p-4 rounded-xl border-2 text-center transition-all ${metode === 'scan' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <div className="text-3xl mb-2">📷</div>
          <p className="font-medium text-sm">Scan Surat Fisik</p>
          <p className="text-xs text-gray-500">Foto surat kertas</p>
        </button>
        <button
          type="button"
          onClick={() => setMetode('upload')}
          className={`p-4 rounded-xl border-2 text-center transition-all ${metode === 'upload' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <div className="text-3xl mb-2">📤</div>
          <p className="font-medium text-sm">Upload File</p>
          <p className="text-xs text-gray-500">PDF/DOC/JPG/PNG</p>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload File (max 5MB)</label>
          {metode === 'scan' ? (
            <div>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
              <button type="button" onClick={() => cameraInputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-all">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm text-gray-600">{fileName || 'Klik untuk mengambil foto'}</p>
              </button>
            </div>
          ) : (
            <div>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileChange} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-all">
                <div className="text-4xl mb-2">📁</div>
                <p className="text-sm text-gray-600">{fileName || 'Klik untuk memilih file'}</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC, DOCX</p>
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <select value={kategori} onChange={e => setKategori(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required>
            <option value="">Pilih Kategori</option>
            {kategoriList.map(k => <option key={k.id_kategori} value={k.nama_kategori}>{k.nama_kategori}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Perihal</label>
          <input type="text" value={perihal} onChange={e => setPerihal(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Masukkan perihal surat" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
          <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Catatan tambahan..." />
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">{error}</div>}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-600 text-sm">
            {success}
            <button onClick={() => onNavigate('riwayat-surat')} className="ml-2 underline font-medium">Lihat Riwayat</button>
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
          {loading ? 'Mengirim...' : 'Kirim Surat'}
        </button>
      </form>
    </div>
  );
}
