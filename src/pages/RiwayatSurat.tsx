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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">📜 Riwayat Surat Saya</h1>
        <button onClick={refresh} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600">Refresh</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Kategori</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Perihal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suratList.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Belum ada surat</td></tr>
              ) : suratList.map((s) => (
                <tr key={s.id_surat} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{s.id_surat}</td>
                  <td className="px-4 py-3">{s.kategori}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate">{s.perihal}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(s.status)}`}>{s.status}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setSelectedSurat(s); setShowDetail(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Detail">👁️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
