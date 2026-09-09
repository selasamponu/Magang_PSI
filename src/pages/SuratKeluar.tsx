import { useState, useEffect, useRef } from 'react';
import { SuratKeluarDB, WargaDB, LogDB } from '../store/db';
import { SuratKeluar, Warga, User } from '../types';
import Modal from '../components/Modal';
import QRCode from 'qrcode';

interface Props {
  currentUser: User;
}

export default function SuratKeluarPage({ currentUser }: Props) {
  const [suratList, setSuratList] = useState<SuratKeluar[]>([]);
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [form, setForm] = useState({ nik_penerima: '', nomor_surat: '', perihal: '' });
  const [fileData, setFileData] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setSuratList(SuratKeluarDB.getAll().sort((a, b) => new Date(b.tanggal_kirim).getTime() - new Date(a.tanggal_kirim).getTime()));
    setWargaList(WargaDB.getAll().filter(w => w.status === 'aktif'));
  };

  useEffect(() => { refresh(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Ukuran file maksimal 5MB!'); return; }
    const reader = new FileReader();
    reader.onload = () => { setFileData(reader.result as string); setFileName(file.name); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const penerima = wargaList.find(w => w.nik === form.nik_penerima);
    if (!penerima) { setError('NIK penerima tidak ditemukan!'); return; }
    if (!fileData) { setError('File harus diupload!'); return; }

    setLoading(true);
    try {
      const id = SuratKeluarDB.generateId();
      const qrDataUrl = await QRCode.toDataURL(id, { width: 300, margin: 2 });
      SuratKeluarDB.create({
        id_surat_keluar: id,
        nik_penerima: form.nik_penerima,
        nama_penerima: penerima.nama_lengkap,
        nomor_surat: form.nomor_surat,
        perihal: form.perihal,
        file_url: fileData,
        file_name: fileName,
        qr_code_url: qrDataUrl,
        tanggal_kirim: new Date().toISOString(),
        status: 'terkirim',
      });
      LogDB.create({ user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user', aktivitas: 'BUAT_SURAT_KELUAR', detail: `Buat surat keluar ${id}` });
      setSuccess(`Surat keluar berhasil dibuat! ID: ${id}`);
      setForm({ nik_penerima: '', nomor_surat: '', perihal: '' });
      setFileData('');
      setFileName('');
      refresh();
    } catch {
      setError('Gagal membuat surat keluar!');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">📤 Surat Keluar</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600">+ Buat Surat Keluar</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Penerima</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nomor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Perihal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suratList.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Belum ada surat keluar</td></tr>
              ) : suratList.map((s) => (
                <tr key={s.id_surat_keluar} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{s.id_surat_keluar}</td>
                  <td className="px-4 py-3">{s.nama_penerima}</td>
                  <td className="px-4 py-3 text-xs">{s.nomor_surat}</td>
                  <td className="px-4 py-3 max-w-[150px] truncate">{s.perihal}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <a href={s.file_url} download={s.file_name} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Download">📄</a>
                      {s.qr_code_url && <button onClick={() => setShowQR(s.qr_code_url)} className="p-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100" title="QR Code">📱</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setError(''); setSuccess(''); }} title="Buat Surat Keluar" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIK Penerima</label>
            <select value={form.nik_penerima} onChange={e => setForm({...form, nik_penerima: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required>
              <option value="">Pilih Warga</option>
              {wargaList.map(w => <option key={w.nik} value={w.nik}>{w.nik} - {w.nama_lengkap}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Surat</label>
            <input type="text" value={form.nomor_surat} onChange={e => setForm({...form, nomor_surat: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="001/KM/TR/2024" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Perihal</label>
            <input type="text" value={form.perihal} onChange={e => setForm({...form, perihal: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Perihal surat" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileChange} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-indigo-400 transition-all">
              <p className="text-sm text-gray-600">{fileName || 'Klik untuk memilih file'}</p>
            </button>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-600 text-sm">{success}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Batal</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 disabled:opacity-50">{loading ? 'Membuat...' : 'Buat Surat'}</button>
          </div>
        </form>
      </Modal>

      {/* QR Modal */}
      <Modal isOpen={!!showQR} onClose={() => setShowQR(null)} title="QR Code Surat Keluar">
        {showQR && (
          <div className="text-center">
            <img src={showQR} alt="QR Code" className="mx-auto max-w-[300px]" />
            <p className="text-sm text-gray-500 mt-3">Scan QR Code ini untuk verifikasi surat</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
