import { useState, useEffect } from 'react';
import { SuratMasukDB } from '../store/db';
import { Warga, SuratMasuk } from '../types';

interface Props {
  warga: Warga;
}

export default function RiwayatSurat({ warga }: Props) {
  const [suratList, setSuratList] = useState<SuratMasuk[]>([]);
  const [selectedSurat, setSelectedSurat] = useState<SuratMasuk | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const refresh = () => {
    const data = SuratMasukDB.getByNik(warga.nik);
    setSuratList(data.sort((a, b) => new Date(b.tanggal_kirim).getTime() - new Date(a.tanggal_kirim).getTime()));
  };

  useEffect(() => { refresh(); }, []);

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
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">📜 Riwayat Surat Saya</h1>
          <p className="text-sm text-gray-500">{suratList.length} surat tercatat</p>
        </div>
        <button onClick={refresh} className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Kategori</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Perihal</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Tanggal</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suratList.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">📜</div>
                  <p>Belum ada surat</p>
                </td></tr>
              ) : suratList.map((s) => (
                <tr key={s.id_surat} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">{s.id_surat}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{s.kategori}</span></td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-gray-700">{s.perihal}</td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge(s.status)}`}>{s.status}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(s.tanggal_kirim).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => { setSelectedSurat(s); setShowDetail(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Detail">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {suratList.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
            <div className="text-4xl mb-2">📜</div>
            <p className="text-gray-400">Belum ada surat</p>
          </div>
        ) : suratList.map((s) => (
          <div key={s.id_surat} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-indigo-600">{s.id_surat}</p>
                <p className="text-sm text-gray-700 truncate mt-0.5">{s.perihal}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ml-2 ${statusBadge(s.status)}`}>{s.status}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{s.kategori}</span>
              <span className="text-xs text-gray-400">{new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}</span>
            </div>
            <button onClick={() => { setSelectedSurat(s); setShowDetail(true); }} className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100">
              👁️ Lihat Detail
            </button>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {showDetail && selectedSurat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetail(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-800">Detail Surat</h3>
              <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)] space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-gray-500">ID Surat</p><p className="font-mono">{selectedSurat.id_surat}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(selectedSurat.status)}`}>{selectedSurat.status}</span></div>
                <div><p className="text-xs text-gray-500">Kategori</p><p>{selectedSurat.kategori}</p></div>
                <div><p className="text-xs text-gray-500">Metode</p><p>{selectedSurat.metode === 'scan' ? '📷 Scan' : '📤 Upload'}</p></div>
                <div className="col-span-2"><p className="text-xs text-gray-500">Perihal</p><p>{selectedSurat.perihal}</p></div>
                {selectedSurat.catatan && <div className="col-span-2"><p className="text-xs text-gray-500">Catatan</p><p>{selectedSurat.catatan}</p></div>}
                <div><p className="text-xs text-gray-500">Tanggal Kirim</p><p>{new Date(selectedSurat.tanggal_kirim).toLocaleString('id-ID')}</p></div>
                {selectedSurat.tanggal_verifikasi && <div><p className="text-xs text-gray-500">Tgl Verifikasi</p><p>{new Date(selectedSurat.tanggal_verifikasi).toLocaleString('id-ID')}</p></div>}
                {selectedSurat.diverifikasi_oleh && <div><p className="text-xs text-gray-500">Oleh</p><p>{selectedSurat.diverifikasi_oleh}</p></div>}
                {selectedSurat.alasan_tolak && <div className="col-span-2"><p className="text-xs text-gray-500">Alasan Tolak</p><p className="text-red-600">{selectedSurat.alasan_tolak}</p></div>}
              </div>
              {selectedSurat.file_url && (
                <a href={selectedSurat.file_url} download={selectedSurat.file_name} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm hover:bg-indigo-100">
                  📄 Download File
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
