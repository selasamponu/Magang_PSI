import { useState, useEffect } from 'react';
import { SuratMasukDB, SuratKeluarDB, LogDB } from '../store/db';
import { Warga, SuratMasuk, SuratKeluar } from '../types';
import Modal from '../components/Modal';
import FilePreview from '../components/FilePreview';

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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [showPreview, setShowPreview] = useState(false);
  const [previewSurat, setPreviewSurat] = useState<SuratMasuk | SuratKeluar | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

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

  useEffect(() => { refresh(); }, [filterStatus]);

  const autoMarkAsSelesai = async (surat: SuratKeluar) => {
    if (surat.status === 'selesai') return;
    try {
      await SuratKeluarDB.updateStatus(surat.id_surat_keluar, 'selesai');
      await LogDB.create({
        user_id: warga.nik, nama_user: warga.nama_lengkap, user_type: 'warga',
        aktivitas: 'BUKA_SURAT_BALASAN', detail: `Buka surat balasan ${surat.id_surat_keluar} — status jadi selesai`,
      });
      setSuratKeluarList((prev) =>
        prev.map((s) => s.id_surat_keluar === surat.id_surat_keluar ? { ...s, status: 'selesai' as const } : s)
      );
      if (selectedSuratKeluar?.id_surat_keluar === surat.id_surat_keluar) {
        setSelectedSuratKeluar({ ...selectedSuratKeluar, status: 'selesai' });
      }
    } catch (err) { console.error('Gagal update status:', err); }
  };

  const handleOpenDetailKeluar = (surat: SuratKeluar) => {
    setSelectedSuratKeluar(surat);
    setShowDetail(true);
    autoMarkAsSelesai(surat);
  };

  const getFullFileUrl = (fileUrl: string) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    return fileUrl; // ✅ Path relatif — Vite/Nginx yang meneruskan
  };

  // ============================================================
  // FITUR DOWNLOAD FILE
  // ============================================================
  const handleDownload = async (surat: SuratMasuk | SuratKeluar) => {
    if (!surat.file_url) {
      alert('File tidak tersedia untuk diunduh!');
      return;
    }

    const id = 'id_surat' in surat ? surat.id_surat : surat.id_surat_keluar;
    setDownloadingId(id);

    try {
      const fullUrl = getFullFileUrl(surat.file_url);
      const response = await fetch(fullUrl, { mode: 'cors' });

      if (!response.ok) {
        throw new Error(`Gagal mengunduh file (${response.status})`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Buat nama file yang rapi
      const fileName =
        surat.file_name ||
        `surat_${id}_${new Date().toISOString().slice(0, 10)}.pdf`;

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke object URL
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);

      // Log aktivitas download
      await LogDB.create({
        user_id: warga.nik,
        nama_user: warga.nama_lengkap,
        user_type: 'warga',
        aktivitas: 'DOWNLOAD_SURAT',
        detail: `Download file ${id} - ${surat.perihal}`,
      });
    } catch (err: any) {
      console.error('Download error:', err);
      alert(err.message || 'Gagal mengunduh file. Silakan coba lagi.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (surat: SuratMasuk | SuratKeluar) => {
    if (!surat.file_url) { alert('File tidak tersedia!'); return; }
    setPreviewSurat(surat);
    setShowPreview(true);
    setPreviewLoading(true);
    setPreviewError('');
    setPreviewBlobUrl('');
    try {
      const fullUrl = getFullFileUrl(surat.file_url);
      const response = await fetch(fullUrl, { mode: 'cors' });
      if (!response.ok) throw new Error(`Gagal memuat file (${response.status})`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      setPreviewBlobUrl(blobUrl);
      if ('id_surat_keluar' in surat) {
        autoMarkAsSelesai(surat as SuratKeluar);
      }
    } catch (err: any) {
      setPreviewError(err.message || 'Gagal memuat file');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewSurat(null);
    if (previewBlobUrl) {
      window.URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl('');
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
      terkirim: '📤', dibaca: '👁️', diverifikasi: '✅', ditolak: '❌',
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
      terkirim: '📬', dibaca: '👁️', selesai: '✅',
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
    <div className="space-y-4 sm:space-y-5">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => setFilterStatus('')}
              className={`rounded-xl p-3 border text-left transition-all ${
                filterStatus === ''
                  ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300 shadow-md'
                  : 'bg-gray-50 border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm shadow-sm flex-shrink-0">📋</div>
                <p className="text-[11px] font-medium text-gray-700 leading-tight">Total</p>
              </div>
              <p className="text-2xl font-bold text-gray-800 leading-none">{statsMasuk.total}</p>
            </button>
            <button
              onClick={() => setFilterStatus('terkirim')}
              className={`rounded-xl p-3 border text-left transition-all ${
                filterStatus === 'terkirim'
                  ? 'bg-blue-100 border-blue-300 shadow-md'
                  : 'bg-blue-50 border-blue-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">📤</div>
                <p className="text-[11px] font-medium text-blue-700 leading-tight">Terkirim</p>
              </div>
              <p className="text-2xl font-bold text-blue-700 leading-none">{statsMasuk.terkirim}</p>
            </button>
            <button
              onClick={() => setFilterStatus('diverifikasi')}
              className={`rounded-xl p-3 border text-left transition-all ${
                filterStatus === 'diverifikasi'
                  ? 'bg-green-100 border-green-300 shadow-md'
                  : 'bg-green-50 border-green-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">✅</div>
                <p className="text-[11px] font-medium text-green-700 leading-tight">Diverifikasi</p>
              </div>
              <p className="text-2xl font-bold text-green-700 leading-none">{statsMasuk.diverifikasi}</p>
            </button>
            <button
              onClick={() => setFilterStatus('ditolak')}
              className={`rounded-xl p-3 border text-left transition-all ${
                filterStatus === 'ditolak'
                  ? 'bg-red-100 border-red-300 shadow-md'
                  : 'bg-red-50 border-red-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">❌</div>
                <p className="text-[11px] font-medium text-red-700 leading-tight">Ditolak</p>
              </div>
              <p className="text-2xl font-bold text-red-700 leading-none">{statsMasuk.ditolak}</p>
            </button>
          </div>

          {filteredSuratMasuk.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
              <div className="text-6xl mb-3">📜</div>
              <p className="text-gray-400 font-medium">Belum ada surat masuk</p>
              <p className="text-gray-300 text-xs mt-1">Kirim surat pertama Anda dari menu Kirim Surat</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSuratMasuk.map((s, idx) => (
                <div
                  key={s.id_surat}
                  className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50/20 hover:shadow-lg transition-all duration-200"
                >
                  <div className="hidden sm:flex items-center justify-center w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl text-sm font-bold shadow-md flex-shrink-0">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start sm:items-center gap-2 flex-wrap mb-1.5">
                      <p className="font-mono text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-md">
                        {s.id_surat}
                      </p>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">{s.kategori}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">📝</span>
                      <p className="font-semibold text-gray-800 truncate">{s.perihal}</p>
                    </div>
                    <p className="text-xs text-gray-400">{s.metode === 'scan' ? '📷 Scan' : '📁 Upload'}</p>
                  </div>

                  <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 sm:hidden">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusBadgeMasuk(s.status)}`}>
                      <span>{statusIconMasuk(s.status)}</span>
                      <span className="capitalize">{s.status}</span>
                    </span>
                  </div>

                  <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4 sm:min-w-[110px]">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 sm:hidden">Tanggal</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span>📅</span>
                      <span className="whitespace-nowrap">
                        {new Date(s.tanggal_kirim).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS: Detail + Download */}
                  <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setSelectedSuratMasuk(s); setShowDetail(true); }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Detail"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {s.file_url && (
                        <button
                          onClick={() => handleDownload(s)}
                          disabled={downloadingId === s.id_surat}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                          title="Download File"
                        >
                          {downloadingId === s.id_surat ? (
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB SURAT BALASAN */}
      {activeTab === 'keluar' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => setFilterStatus('')}
              className={`rounded-xl p-3 border text-left transition-all ${
                filterStatus === ''
                  ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300 shadow-md'
                  : 'bg-gray-50 border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm shadow-sm flex-shrink-0">📬</div>
                <p className="text-[11px] font-medium text-gray-700 leading-tight">Total</p>
              </div>
              <p className="text-2xl font-bold text-gray-800 leading-none">{statsKeluar.total}</p>
            </button>
            <button
              onClick={() => setFilterStatus('terkirim')}
              className={`rounded-xl p-3 border text-left transition-all ${
                filterStatus === 'terkirim'
                  ? 'bg-indigo-100 border-indigo-300 shadow-md'
                  : 'bg-indigo-50 border-indigo-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">📤</div>
                <p className="text-[11px] font-medium text-indigo-700 leading-tight">Belum Dibaca</p>
              </div>
              <p className="text-2xl font-bold text-indigo-700 leading-none">{statsKeluar.terkirim}</p>
            </button>
            <button
              onClick={() => setFilterStatus('selesai')}
              className={`rounded-xl p-3 border text-left transition-all ${
                filterStatus === 'selesai'
                  ? 'bg-green-100 border-green-300 shadow-md'
                  : 'bg-green-50 border-green-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">✅</div>
                <p className="text-[11px] font-medium text-green-700 leading-tight">Sudah Dibaca</p>
              </div>
              <p className="text-2xl font-bold text-green-700 leading-none">{statsKeluar.selesai}</p>
            </button>
          </div>

          {filteredSuratKeluar.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
              <div className="text-6xl mb-3">📬</div>
              <p className="text-gray-400 font-medium">Belum ada surat balasan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSuratKeluar.map((s, idx) => (
                <div
                  key={s.id_surat_keluar}
                  className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/20 hover:shadow-lg transition-all duration-200"
                >
                  <div className="hidden sm:flex items-center justify-center w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-bold shadow-md flex-shrink-0">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start sm:items-center gap-2 flex-wrap mb-1.5">
                      <p className="font-mono text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                        {s.id_surat_keluar}
                      </p>
                      <span className="font-mono text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                        {s.nomor_surat}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">✉️</span>
                      <p className="font-semibold text-gray-800 truncate">{s.perihal}</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 sm:hidden">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusBadgeKeluar(s.status)}`}>
                      <span>{statusIconKeluar(s.status)}</span>
                      <span className="capitalize">{s.status}</span>
                    </span>
                  </div>

                  <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4 sm:min-w-[110px]">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 sm:hidden">Tanggal</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span>📅</span>
                      <span className="whitespace-nowrap">
                        {new Date(s.tanggal_kirim).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS: Detail + Download untuk Surat Balasan */}
                  <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenDetailKeluar(s)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Detail"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {s.file_url && (
                        <button
                          onClick={() => handleDownload(s)}
                          disabled={downloadingId === s.id_surat_keluar}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                          title="Download Surat Balasan"
                        >
                          {downloadingId === s.id_surat_keluar ? (
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* DETAIL MODAL SURAT MASUK */}
      <Modal
        isOpen={showDetail && !!selectedSuratMasuk}
        onClose={() => { setShowDetail(false); setSelectedSuratMasuk(null); }}
        title="Detail Surat Masuk"
        size="lg"
      >
        {selectedSuratMasuk && (
          <div className="space-y-4">
            <div className={`rounded-2xl p-5 ${statusBadgeMasuk(selectedSuratMasuk.status)}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Status Surat</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    {statusIconMasuk(selectedSuratMasuk.status)} {selectedSuratMasuk.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">ID Surat</p>
                  <p className="font-mono text-sm font-bold">{selectedSuratMasuk.id_surat}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">📂 Kategori</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedSuratMasuk.kategori}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">📤 Metode</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedSuratMasuk.metode === 'scan' ? '📷 Scan' : '📁 Upload'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">📝 Perihal</p>
                <p className="text-sm font-semibold text-gray-800 leading-relaxed">{selectedSuratMasuk.perihal}</p>
              </div>
              {selectedSuratMasuk.catatan && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">📌 Catatan</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-white/60 rounded-lg p-3">{selectedSuratMasuk.catatan}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">📅 Tanggal Kirim</p>
                <p className="text-sm text-gray-800">{new Date(selectedSuratMasuk.tanggal_kirim).toLocaleString('id-ID')}</p>
              </div>
              {selectedSuratMasuk.alasan_tolak && (
                <div>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1.5">❌ Alasan Tolak</p>
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg leading-relaxed">
                    {selectedSuratMasuk.alasan_tolak}
                  </p>
                </div>
              )}
            </div>
            {selectedSuratMasuk.file_url && (
              <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePreview(selectedSuratMasuk)}
                  className="py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </button>
                <button
                  onClick={() => handleDownload(selectedSuratMasuk)}
                  disabled={downloadingId === selectedSuratMasuk.id_surat}
                  className="py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {downloadingId === selectedSuratMasuk.id_surat ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* DETAIL MODAL SURAT BALASAN */}
      <Modal
        isOpen={showDetail && !!selectedSuratKeluar}
        onClose={() => { setShowDetail(false); setSelectedSuratKeluar(null); }}
        title="Detail Surat Balasan"
        size="lg"
      >
        {selectedSuratKeluar && (
          <div className="space-y-4">
            <div className={`rounded-2xl p-5 ${statusBadgeKeluar(selectedSuratKeluar.status)}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Status Surat</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    {statusIconKeluar(selectedSuratKeluar.status)} {selectedSuratKeluar.status}
                  </p>
                  {selectedSuratKeluar.status === 'selesai' && (
                    <p className="text-xs mt-1 opacity-80">✅ Anda sudah membaca surat ini</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">ID Surat</p>
                  <p className="font-mono text-sm font-bold">{selectedSuratKeluar.id_surat_keluar}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">🔢 Nomor Surat</p>
                <p className="font-mono text-sm font-bold text-gray-800 bg-white/60 rounded-lg px-3 py-2 inline-block">
                  {selectedSuratKeluar.nomor_surat}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">📝 Perihal</p>
                <p className="text-sm font-semibold text-gray-800 leading-relaxed">{selectedSuratKeluar.perihal}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">👤 Penerima</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedSuratKeluar.nama_penerima}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">📅 Tanggal</p>
                  <p className="text-sm text-gray-800">{new Date(selectedSuratKeluar.tanggal_kirim).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
            {selectedSuratKeluar.file_url && (
              <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePreview(selectedSuratKeluar)}
                  className="py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </button>
                <button
                  onClick={() => handleDownload(selectedSuratKeluar)}
                  disabled={downloadingId === selectedSuratKeluar.id_surat_keluar}
                  className="py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {downloadingId === selectedSuratKeluar.id_surat_keluar ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* PREVIEW MODAL */}
      {showPreview && previewSurat && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-black/90 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl flex-shrink-0">📄</span>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{previewSurat.file_name || 'Preview Surat'}</p>
                <p className="text-xs text-gray-400 font-mono truncate">
                  {'id_surat' in previewSurat ? previewSurat.id_surat : previewSurat.id_surat_keluar}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleDownload(previewSurat)}
                disabled={downloadingId === ('id_surat' in previewSurat ? previewSurat.id_surat : previewSurat.id_surat_keluar)}
                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button
                onClick={handleClosePreview}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden bg-gray-800">
            {previewLoading && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-white text-sm">Memuat file...</p>
                </div>
              </div>
            )}
            {!previewLoading && previewError && (
              <div className="w-full h-full flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-2xl">
                  <div className="text-7xl mb-4">⚠️</div>
                  <p className="font-bold text-red-600 text-lg">Gagal Memuat File</p>
                  <p className="text-sm text-gray-500 mt-2">{previewError}</p>
                  <button onClick={handleClosePreview} className="mt-5 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold">
                    Tutup
                  </button>
                </div>
              </div>
            )}
            {!previewLoading && !previewError && previewBlobUrl && (
              <FilePreview
                blobUrl={previewBlobUrl}
                fileName={previewSurat.file_name || 'file'}
                originalUrl={previewSurat.file_url}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}