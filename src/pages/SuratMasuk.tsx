import { useState, useEffect } from 'react';
import { SuratMasukDB, LogDB } from '../store/db';
import { SuratMasuk, User } from '../types';
import Modal from '../components/Modal';

interface Props {
  currentUser: User;
}

export default function SuratMasukPage({ currentUser }: Props) {
  const [suratList, setSuratList] = useState<SuratMasuk[]>([]);
  const [selectedSurat, setSelectedSurat] = useState<SuratMasuk | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showTolak, setShowTolak] = useState(false);
  const [alasanTolak, setAlasanTolak] = useState('');
  const [filter, setFilter] = useState('semua');
  const [search, setSearch] = useState('');

  const refresh = () => {
    let data = SuratMasukDB.getAll();
    if (filter !== 'semua') data = data.filter(s => s.status === filter);
    if (search) data = data.filter(s => s.nama_pengirim.toLowerCase().includes(search.toLowerCase()) || s.id_surat.includes(search) || s.perihal.toLowerCase().includes(search.toLowerCase()));
    setSuratList(data.sort((a, b) => new Date(b.tanggal_kirim).getTime() - new Date(a.tanggal_kirim).getTime()));
  };

  useEffect(() => { refresh(); }, [filter, search]);

  const handleVerifikasi = (id: string) => {
    if (confirm('Verifikasi surat ini?')) {
      SuratMasukDB.updateStatus(id, 'diverifikasi', { diverifikasi_oleh: currentUser.nama });
      LogDB.create({ user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user', aktivitas: 'VERIFIKASI_SURAT', detail: `Surat ${id} diverifikasi` });
      refresh();
    }
  };

  const handleTolak = () => {
    if (!selectedSurat) return;
    if (!alasanTolak.trim()) { alert('Alasan penolakan harus diisi!'); return; }
    SuratMasukDB.updateStatus(selectedSurat.id_surat, 'ditolak', { diverifikasi_oleh: currentUser.nama, alasan_tolak: alasanTolak });
    LogDB.create({ user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user', aktivitas: 'VERIFIKASI_SURAT', detail: `Surat ${selectedSurat.id_surat} ditolak` });
    setShowTolak(false);
    setAlasanTolak('');
    setSelectedSurat(null);
    refresh();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      terkirim: 'bg-blue-100 text-blue-700',
      dibaca: 'bg-blue-100 text-blue-700',
      diverifikasi: 'bg-green-100 text-green-700',
      ditolak: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">📨 Surat Masuk</h1>
        <button onClick={refresh} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600">Refresh</button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Cari ID, pengirim, atau perihal..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="semua">Semua Status</option>
          <option value="terkirim">Terkirim</option>
          <option value="dibaca">Dibaca</option>
          <option value="diverifikasi">Diverifikasi</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pengirim</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Kategori</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Perihal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suratList.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada data</td></tr>
              ) : suratList.map((s) => (
                <tr key={s.id_surat} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{s.id_surat}</td>
                  <td className="px-4 py-3">{s.nama_pengirim}</td>
                  <td className="px-4 py-3">{s.kategori}</td>
                  <td className="px-4 py-3 max-w-[150px] truncate">{s.perihal}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(s.status)}`}>{s.status}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setSelectedSurat(s); setShowDetail(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Detail">👁️</button>
                      {(s.status === 'terkirim' || s.status === 'dibaca') && (
                        <>
                          <button onClick={() => handleVerifikasi(s.id_surat)} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Verifikasi">✅</button>
                          <button onClick={() => { setSelectedSurat(s); setShowTolak(true); }} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Tolak">❌</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Detail Surat" size="lg">
        {selectedSurat && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-gray-500">ID Surat</p><p className="font-mono text-sm">{selectedSurat.id_surat}</p></div>
              <div><p className="text-xs text-gray-500">Status</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(selectedSurat.status)}`}>{selectedSurat.status}</span></div>
              <div><p className="text-xs text-gray-500">Pengirim</p><p className="text-sm">{selectedSurat.nama_pengirim}</p></div>
              <div><p className="text-xs text-gray-500">NIK</p><p className="text-sm font-mono">{selectedSurat.nik_pengirim}</p></div>
              <div><p className="text-xs text-gray-500">Metode</p><p className="text-sm">{selectedSurat.metode === 'scan' ? '📷 Scan' : '📤 Upload'}</p></div>
              <div><p className="text-xs text-gray-500">Kategori</p><p className="text-sm">{selectedSurat.kategori}</p></div>
              <div className="col-span-2"><p className="text-xs text-gray-500">Perihal</p><p className="text-sm">{selectedSurat.perihal}</p></div>
              {selectedSurat.catatan && <div className="col-span-2"><p className="text-xs text-gray-500">Catatan</p><p className="text-sm">{selectedSurat.catatan}</p></div>}
              <div><p className="text-xs text-gray-500">Tanggal Kirim</p><p className="text-sm">{new Date(selectedSurat.tanggal_kirim).toLocaleString('id-ID')}</p></div>
              {selectedSurat.tanggal_verifikasi && <div><p className="text-xs text-gray-500">Tanggal Verifikasi</p><p className="text-sm">{new Date(selectedSurat.tanggal_verifikasi).toLocaleString('id-ID')}</p></div>}
              {selectedSurat.diverifikasi_oleh && <div><p className="text-xs text-gray-500">Diverifikasi Oleh</p><p className="text-sm">{selectedSurat.diverifikasi_oleh}</p></div>}
              {selectedSurat.alasan_tolak && <div className="col-span-2"><p className="text-xs text-gray-500">Alasan Tolak</p><p className="text-sm text-red-600">{selectedSurat.alasan_tolak}</p></div>}
            </div>
            {selectedSurat.file_url && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-1">File</p>
                <a href={selectedSurat.file_url} download={selectedSurat.file_name} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm hover:bg-indigo-100">
                  📄 Download File ({selectedSurat.file_name})
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Tolak Modal */}
      <Modal isOpen={showTolak} onClose={() => setShowTolak(false)} title="Tolak Surat">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Tolak surat <strong>{selectedSurat?.id_surat}</strong>?</p>
          <textarea value={alasanTolak} onChange={e => setAlasanTolak(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300" placeholder="Alasan penolakan..." />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowTolak(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Batal</button>
            <button onClick={handleTolak} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">Tolak Surat</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
