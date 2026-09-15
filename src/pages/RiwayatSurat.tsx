import { useState, useEffect } from 'react';
import { SuratMasukDB, SuratKeluarDB, LogDB } from '../store/db';
import { Warga, SuratMasuk, SuratKeluar } from '../types';
import Modal from '../components/Modal';

interface Props {
  warga: Warga;
}

type TabType = 'masuk' | 'keluar';

export default function RiwayatSurat({ warga }: Props) {
  const [suratMasukList, setSuratMasukList] = useState<SuratMasuk[]>([]);
  const [suratKeluarList, setSuratKeluarList] = useState<SuratKeluar[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('masuk');
  const [selectedSuratMasuk, setSelectedSuratMasuk] = useState<SuratMasuk | null>(null);
  const [selectedSuratKeluar, setSelectedSuratKeluar] = useState<SuratKeluar | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const refresh = async () => {
    try {
      setLoading(true);

      const masukData = await SuratMasukDB.getByNik(warga.nik);
      setSuratMasukList(
        masukData.sort(
          (a: SuratMasuk, b: SuratMasuk) =>
            new Date(b.tanggal_kirim).getTime() - new Date(a.tanggal_kirim).getTime()
        )
      );

      const keluarData = await SuratKeluarDB.getAll();
      setSuratKeluarList(
        keluarData
          .filter((s: SuratKeluar) => s.nik_penerima === warga.nik)
          .sort(
            (a: SuratKeluar, b: SuratKeluar) =>
              new Date(b.tanggal_kirim).getTime() - new Date(a.tanggal_kirim).getTime()
          )
      );
    } catch (err) {
      console.error('Error loading riwayat:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [filterStatus]);

  // ✅ AUTO-UPDATE STATUS → 'selesai'
  const autoMarkAsSelesai = async (surat: SuratKeluar) => {
    if (surat.status === 'selesai') return;

    try {
      await SuratKeluarDB.updateStatus(surat.id_surat_keluar, 'selesai');

      await LogDB.create({
        user_id: warga.nik,
        nama_user: warga.nama_lengkap,
        user_type: 'warga',
        aktivitas: 'BUKA_SURAT_BALASAN',
        detail: `Buka surat balasan ${surat.id_surat_keluar} — status jadi selesai`,
      });

      setSuratKeluarList((prev) =>
        prev.map((s) =>
          s.id_surat_keluar === surat.id_surat_keluar
            ? { ...s, status: 'selesai' as const }
            : s
        )
      );

      if (selectedSuratKeluar?.id_surat_keluar === surat.id_surat_keluar) {
        setSelectedSuratKeluar({ ...selectedSuratKeluar, status: 'selesai' });
      }
    } catch (err) {
      console.error('Gagal update status:', err);
    }
  };

  // ✅ HANDLER: Buka detail → auto selesai
  const handleOpenDetailKeluar = (surat: SuratKeluar) => {
    setSelectedSuratKeluar(surat);
    setShowDetail(true);
    autoMarkAsSelesai(surat);
  };

  // ✅ HANDLER: Download → auto selesai
  const handleDownload = (fileUrl: string, fileName: string, surat?: SuratKeluar) => {
    if (!fileUrl) {
      alert('File tidak tersedia!');
      return;
    }

    let fullUrl = fileUrl;
    if (fileUrl.startsWith('/uploads/')) {
      fullUrl = `http://${window.location.hostname}:5000${fileUrl}`;
    }

    const a = document.createElement('a');
    a.href = fullUrl;
    a.download = fileName || 'surat';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // ✅ Auto-mark as selesai kalau ini surat keluar
    if (surat) {
      autoMarkAsSelesai(surat);
    }
  };

  const statusBadgeMasuk = (status: string) => {
    const map: Record<string, string> = {
      terkirim: 'bg-blue-100 text-blue-700 border border-blue-200',
      dibaca: 'bg-sky-100 text-sky-700 border border-sky-200',
      diverifikasi: 'bg-green-100 text-green-700 border border-green-200',
      ditolak: 'bg-red-100 text-red-700 border border-red-200',
    };
    return map[status] || 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const statusIconMasuk = (status: string) => {
    const map: Record<string, string> = {
      terkirim: '📤',
      dibaca: '👁️',
      diverifikasi: '✅',
      ditolak: '❌',
    };
    return map[status] || '📄';
  };

  const statusBadgeKeluar = (status: string) => {
    const map: Record<string, string> = {
      terkirim: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
      dibaca: 'bg-sky-100 text-sky-700 border border-sky-200',
      selesai: 'bg-green-100 text-green-700 border border-green-200',
    };
    return map[status] || 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const statusIconKeluar = (status: string) => {
    const map: Record<string, string> = {
      terkirim: '📬',
      dibaca: '👁️',
      selesai: '✅',
    };
    return map[status] || '📄';
  };

  const filteredSuratMasuk = filterStatus
    ? suratMasukList.filter((s) => s.status === filterStatus)
    : suratMasukList;

  const filteredSuratKeluar = filterStatus
    ? suratKeluarList.filter((s) => s.status === filterStatus)
    : suratKeluarList;

  const statsMasuk = {
    total: suratMasukList.length,
    terkirim: suratMasukList.filter((s) => s.status === 'terkirim').length,
    diverifikasi: suratMasukList.filter((s) => s.status === 'diverifikasi').length,
    ditolak: suratMasukList.filter((s) => s.status === 'ditolak').length,
  };

  const statsKeluar = {
    total: suratKeluarList.length,
    terkirim: suratKeluarList.filter((s) => s.status === 'terkirim').length,
    selesai: suratKeluarList.filter((s) => s.status === 'selesai').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">📜 Riwayat Surat Saya</h1>
          <p className="text-sm text-gray-500 mt-1">
            {statsMasuk.total} surat masuk • {statsKeluar.total} surat balasan
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 disabled:opacity-50 hover-scale"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setActiveTab('masuk'); setFilterStatus(''); }}
            className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'masuk'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-lg">📨</span>
            <span>Surat Masuk ({statsMasuk.total})</span>
          </button>
          <button
            onClick={() => { setActiveTab('keluar'); setFilterStatus(''); }}
            className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'keluar'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-lg">📬</span>
            <span>Surat Balasan ({statsKeluar.total})</span>
          </button>
        </div>
      </div>

      {/* TAB SURAT MASUK */}
      {activeTab === 'masuk' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setFilterStatus('')}
              className={`rounded-2xl p-4 border text-left transition-all card-hover ${
                filterStatus === ''
                  ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300 shadow-lg shadow-purple-500/20'
                  : 'bg-white border-gray-100 shadow-sm hover:border-purple-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-bold text-gray-800">{statsMasuk.total}</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setFilterStatus('terkirim')}
              className={`rounded-2xl p-4 border text-left transition-all card-hover ${
                filterStatus === 'terkirim'
                  ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-lg'
                  : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">📤</span>
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Terkirim</p>
                  <p className="text-2xl font-bold text-blue-700">{statsMasuk.terkirim}</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setFilterStatus('diverifikasi')}
              className={`rounded-2xl p-4 border text-left transition-all card-hover ${
                filterStatus === 'diverifikasi'
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-lg'
                  : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Diverifikasi</p>
                  <p className="text-2xl font-bold text-green-700">{statsMasuk.diverifikasi}</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setFilterStatus('ditolak')}
              className={`rounded-2xl p-4 border text-left transition-all card-hover ${
                filterStatus === 'ditolak'
                  ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 shadow-lg'
                  : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Ditolak</p>
                  <p className="text-2xl font-bold text-red-700">{statsMasuk.ditolak}</p>
                </div>
              </div>
            </button>
          </div>

          <div className="hidden sm:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden card-hover">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <tr>
                    <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">ID Surat</th>
                    <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Kategori</th>
                    <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Perihal</th>
                    <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Tanggal</th>
                    <th className="text-center px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSuratMasuk.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16">
                        <div className="text-6xl mb-3">📜</div>
                        <p className="text-gray-400 font-medium">Belum ada surat masuk</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSuratMasuk.map((s) => (
                      <tr key={s.id_surat} className="hover:bg-purple-50/30 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-purple-600 font-semibold">{s.id_surat}</td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">{s.kategori}</span>
                        </td>
                        <td className="px-5 py-4 max-w-[200px] truncate text-gray-700">{s.perihal}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeMasuk(s.status)}`}>
                            <span>{statusIconMasuk(s.status)}</span>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(s.tanggal_kirim).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => { setSelectedSuratMasuk(s); setShowDetail(true); }}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sm:hidden space-y-3">
            {filteredSuratMasuk.map((s) => (
              <div key={s.id_surat} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 space-y-3">
                <p className="font-mono text-xs text-purple-600 font-semibold">{s.id_surat}</p>
                <p className="text-sm text-gray-700 truncate">{s.perihal}</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadgeMasuk(s.status)}`}>
                  <span>{statusIconMasuk(s.status)}</span> {s.status}
                </span>
                <button
                  onClick={() => { setSelectedSuratMasuk(s); setShowDetail(true); }}
                  className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold"
                >
                  👁️ Lihat Detail
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* TAB SURAT BALASAN */}
      {activeTab === 'keluar' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setFilterStatus('')}
              className={`rounded-2xl p-4 border text-left transition-all card-hover ${
                filterStatus === ''
                  ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300 shadow-lg shadow-purple-500/20'
                  : 'bg-white border-gray-100 shadow-sm hover:border-purple-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">📬</span>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-bold text-gray-800">{statsKeluar.total}</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setFilterStatus('terkirim')}
              className={`rounded-2xl p-4 border text-left transition-all card-hover ${
                filterStatus === 'terkirim'
                  ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-300 shadow-lg'
                  : 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">📤</span>
                <div>
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Belum Dibaca</p>
                  <p className="text-2xl font-bold text-indigo-700">{statsKeluar.terkirim}</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setFilterStatus('selesai')}
              className={`rounded-2xl p-4 border text-left transition-all card-hover ${
                filterStatus === 'selesai'
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-lg'
                  : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Sudah Dibaca</p>
                  <p className="text-2xl font-bold text-green-700">{statsKeluar.selesai}</p>
                </div>
              </div>
            </button>
          </div>

          <div className="hidden sm:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden card-hover">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <tr>
                    <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">ID Surat</th>
                    <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Nomor</th>
                    <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Perihal</th>
                    <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Tanggal</th>
                    <th className="text-center px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSuratKeluar.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16">
                        <div className="text-6xl mb-3">📬</div>
                        <p className="text-gray-400 font-medium">Belum ada surat balasan</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSuratKeluar.map((s) => (
                      <tr key={s.id_surat_keluar} className="hover:bg-purple-50/30 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-indigo-600 font-semibold">{s.id_surat_keluar}</td>
                        <td className="px-5 py-4 font-mono text-xs text-gray-600">{s.nomor_surat}</td>
                        <td className="px-5 py-4 max-w-[200px] truncate text-gray-700">{s.perihal}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeKeluar(s.status)}`}>
                            <span>{statusIconKeluar(s.status)}</span>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(s.tanggal_kirim).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex gap-1.5 justify-center">
                            <button
                              onClick={() => handleOpenDetailKeluar(s)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              title="Buka Detail (auto selesai)"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {s.file_url && (
                              <button
                                onClick={() => handleDownload(s.file_url, s.file_name, s)}
                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                title="Download (auto selesai)"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-6-6m6 6l6-6m2 5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sm:hidden space-y-3">
            {filteredSuratKeluar.map((s) => (
              <div key={s.id_surat_keluar} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-indigo-600 font-semibold">{s.id_surat_keluar}</p>
                    <p className="font-mono text-xs text-gray-400 mt-0.5">{s.nomor_surat}</p>
                    <p className="text-sm text-gray-700 truncate mt-1">{s.perihal}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ml-2 ${statusBadgeKeluar(s.status)}`}>
                    <span>{statusIconKeluar(s.status)}</span> {s.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleOpenDetailKeluar(s)}
                    className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold"
                  >
                    👁️ Detail
                  </button>
                  {s.file_url && (
                    <button
                      onClick={() => handleDownload(s.file_url, s.file_name, s)}
                      className="flex-1 py-2.5 bg-green-50 text-green-600 rounded-xl text-xs font-semibold"
                    >
                      📄 Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Detail Surat Masuk */}
      <Modal
        isOpen={showDetail && !!selectedSuratMasuk}
        onClose={() => { setShowDetail(false); setSelectedSuratMasuk(null); }}
        title="Detail Surat Masuk"
        size="lg"
      >
        {selectedSuratMasuk && (
          <div className="space-y-4">
            <div className={`rounded-2xl p-5 ${statusBadgeMasuk(selectedSuratMasuk.status)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Status Surat</p>
                  <p className="text-2xl font-bold mt-1">{statusIconMasuk(selectedSuratMasuk.status)} {selectedSuratMasuk.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">ID Surat</p>
                  <p className="font-mono text-sm font-bold mt-1">{selectedSuratMasuk.id_surat}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</p><p className="text-sm font-semibold mt-1">{selectedSuratMasuk.kategori}</p></div>
                <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Metode</p><p className="text-sm font-semibold mt-1">{selectedSuratMasuk.metode === 'scan' ? '📷 Scan' : '📤 Upload'}</p></div>
                <div className="sm:col-span-2"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Perihal</p><p className="text-sm font-semibold mt-1">{selectedSuratMasuk.perihal}</p></div>
                {selectedSuratMasuk.catatan && <div className="sm:col-span-2"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Catatan</p><p className="text-sm mt-1">{selectedSuratMasuk.catatan}</p></div>}
                <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Kirim</p><p className="text-sm mt-1">{new Date(selectedSuratMasuk.tanggal_kirim).toLocaleString('id-ID')}</p></div>
                {selectedSuratMasuk.alasan_tolak && <div className="sm:col-span-2"><p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Alasan Tolak</p><p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl mt-1">{selectedSuratMasuk.alasan_tolak}</p></div>}
              </div>
            </div>
            {selectedSuratMasuk.file_url && (
              <button
                onClick={() => handleDownload(selectedSuratMasuk.file_url, selectedSuratMasuk.file_name)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
              >
                📄 Download File
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Detail Surat Balasan */}
      <Modal
        isOpen={showDetail && !!selectedSuratKeluar}
        onClose={() => { setShowDetail(false); setSelectedSuratKeluar(null); }}
        title="Detail Surat Balasan"
        size="lg"
      >
        {selectedSuratKeluar && (
          <div className="space-y-4">
            <div className={`rounded-2xl p-5 ${statusBadgeKeluar(selectedSuratKeluar.status)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Status Surat</p>
                  <p className="text-2xl font-bold mt-1">{statusIconKeluar(selectedSuratKeluar.status)} {selectedSuratKeluar.status}</p>
                  {selectedSuratKeluar.status === 'selesai' && (
                    <p className="text-xs mt-1 opacity-80">✅ Anda sudah membaca surat ini</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">ID Surat</p>
                  <p className="font-mono text-sm font-bold mt-1">{selectedSuratKeluar.id_surat_keluar}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nomor Surat</p><p className="font-mono text-sm font-semibold mt-1">{selectedSuratKeluar.nomor_surat}</p></div>
                <div className="sm:col-span-2"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Perihal</p><p className="text-sm font-semibold mt-1">{selectedSuratKeluar.perihal}</p></div>
                <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Penerima</p><p className="text-sm font-semibold mt-1">{selectedSuratKeluar.nama_penerima}</p></div>
                <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</p><p className="text-sm mt-1">{new Date(selectedSuratKeluar.tanggal_kirim).toLocaleString('id-ID')}</p></div>
              </div>
            </div>
            {selectedSuratKeluar.file_url && (
              <button
                onClick={() => handleDownload(selectedSuratKeluar.file_url, selectedSuratKeluar.file_name, selectedSuratKeluar)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
              >
                📄 Download File Surat
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}