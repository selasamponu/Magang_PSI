import { useState, useEffect, useMemo } from 'react';
import { SuratMasukDB, KategoriDB, LogDB } from '../store/db';
import { SuratMasuk, User, Kategori } from '../types';
import Modal from '../components/Modal';
import FilePreview from '../components/FilePreview';

interface Props {
  currentUser: User;
}

export default function SuratMasukPage({ currentUser }: Props) {
  const [allSurat, setAllSurat] = useState<SuratMasuk[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [selectedSurat, setSelectedSurat] = useState<SuratMasuk | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showTolak, setShowTolak] = useState(false);
  const [alasanTolak, setAlasanTolak] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SuratMasuk | null>(null);

  const [showPreview, setShowPreview] = useState(false);
  const [previewSurat, setPreviewSurat] = useState<SuratMasuk | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMetode, setFilterMetode] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTanggalDari, setFilterTanggalDari] = useState('');
  const [filterTanggalSampai, setFilterTanggalSampai] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await SuratMasukDB.getAll();
      setAllSurat(
        data.sort((a: SuratMasuk, b: SuratMasuk) =>
          new Date(b.tanggal_kirim).getTime() - new Date(a.tanggal_kirim).getTime()
        )
      );
    } catch (err) {
      console.error('Error loading surat masuk:', err);
    } finally {
      setLoading(false);
    }
  };

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
    refresh();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set(allSurat.map(s => new Date(s.tanggal_kirim).getFullYear().toString()));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [allSurat]);

  const months = [
    { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
    { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
  ];

  const filteredSurat = useMemo(() => {
    let data = [...allSurat];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(s =>
        s.nama_pengirim.toLowerCase().includes(q) ||
        s.id_surat.toLowerCase().includes(q) ||
        s.perihal.toLowerCase().includes(q) ||
        s.nik_pengirim.includes(q)
      );
    }
    if (filterKategori) data = data.filter(s => s.kategori === filterKategori);
    if (filterStatus) data = data.filter(s => s.status === filterStatus);
    if (filterMetode) data = data.filter(s => s.metode === filterMetode);
    if (filterTahun) data = data.filter(s => new Date(s.tanggal_kirim).getFullYear().toString() === filterTahun);
    if (filterBulan) data = data.filter(s => (new Date(s.tanggal_kirim).getMonth() + 1).toString() === filterBulan);
    if (filterTanggalDari) {
      const dari = new Date(filterTanggalDari);
      dari.setHours(0, 0, 0, 0);
      data = data.filter(s => new Date(s.tanggal_kirim) >= dari);
    }
    if (filterTanggalSampai) {
      const sampai = new Date(filterTanggalSampai);
      sampai.setHours(23, 59, 59, 999);
      data = data.filter(s => new Date(s.tanggal_kirim) <= sampai);
    }
    return data;
  }, [allSurat, search, filterKategori, filterStatus, filterMetode, filterTahun, filterBulan, filterTanggalDari, filterTanggalSampai]);

  const totalPages = Math.ceil(filteredSurat.length / itemsPerPage);
  const paginatedSurat = filteredSurat.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [search, filterKategori, filterStatus, filterMetode, filterTahun, filterBulan, filterTanggalDari, filterTanggalSampai]);

  const resetFilters = () => {
    setSearch(''); setFilterKategori(''); setFilterStatus(''); setFilterMetode('');
    setFilterTahun(''); setFilterBulan(''); setFilterTanggalDari(''); setFilterTanggalSampai('');
  };

  const activeFilterCount = [filterKategori, filterStatus, filterMetode, filterTahun, filterBulan, filterTanggalDari, filterTanggalSampai].filter(Boolean).length;

  const handleVerifikasi = async (id: string) => {
    if (!confirm('Verifikasi surat ini?')) return;
    try {
      await SuratMasukDB.updateStatus(id, 'diverifikasi', { diverifikasi_oleh: currentUser.nama });
      await LogDB.create({
        user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user',
        aktivitas: 'VERIFIKASI_SURAT', detail: `Surat ${id} diverifikasi`,
      });
      await refresh();
    } catch (err) {
      console.error(err);
      alert('Gagal memverifikasi surat');
    }
  };

  const handleTolak = async () => {
    if (!selectedSurat) return;
    if (!alasanTolak.trim()) { alert('Alasan penolakan harus diisi!'); return; }
    try {
      await SuratMasukDB.updateStatus(selectedSurat.id_surat, 'ditolak', {
        diverifikasi_oleh: currentUser.nama, alasan_tolak: alasanTolak,
      });
      await LogDB.create({
        user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user',
        aktivitas: 'VERIFIKASI_SURAT', detail: `Surat ${selectedSurat.id_surat} ditolak`,
      });
      setShowTolak(false);
      setAlasanTolak('');
      setSelectedSurat(null);
      await refresh();
    } catch (err) {
      console.error(err);
      alert('Gagal menolak surat');
    }
  };

  const openDeleteModal = (surat: SuratMasuk) => {
    setDeleteTarget(surat);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      await SuratMasukDB.delete(deleteTarget.id_surat);
      await LogDB.create({
        user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user',
        aktivitas: 'HAPUS_SURAT_MASUK', detail: `Hapus surat masuk ${deleteTarget.id_surat}`,
      });
      setShowDelete(false);
      setDeleteTarget(null);
      await refresh();
    } catch (err: any) {
      console.error('❌ Error delete:', err);
      alert('Gagal menghapus surat: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getFullFileUrl = (fileUrl: string) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    return fileUrl; // ✅ Path relatif — Vite/Nginx yang meneruskan
  };

  const handlePreview = async (surat: SuratMasuk) => {
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

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      terkirim: 'bg-blue-100 text-blue-700 border border-blue-200',
      dibaca: 'bg-sky-100 text-sky-700 border border-sky-200',
      diverifikasi: 'bg-green-100 text-green-700 border border-green-200',
      ditolak: 'bg-red-100 text-red-700 border border-red-200',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const statusIcon = (status: string) => {
    const map: Record<string, string> = {
      terkirim: '📤', dibaca: '👁️', diverifikasi: '✅', ditolak: '❌',
    };
    return map[status] || '📄';
  };

  const stats = {
    total: allSurat.length,
    terkirim: allSurat.filter(s => s.status === 'terkirim').length,
    diverifikasi: allSurat.filter(s => s.status === 'diverifikasi').length,
    ditolak: allSurat.filter(s => s.status === 'ditolak').length,
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">📨 Surat Masuk</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola dan verifikasi surat masuk dari warga</p>
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

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white rounded-xl p-3 border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm shadow-sm flex-shrink-0">📋</div>
            <p className="text-[11px] font-medium text-gray-600 leading-tight">Total</p>
          </div>
          <p className="text-2xl font-bold text-gray-800 leading-none">{stats.total}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">📤</div>
            <p className="text-[11px] font-medium text-blue-700 leading-tight">Terkirim</p>
          </div>
          <p className="text-2xl font-bold text-blue-700 leading-none">{stats.terkirim}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border border-green-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">✅</div>
            <p className="text-[11px] font-medium text-green-700 leading-tight">Diverifikasi</p>
          </div>
          <p className="text-2xl font-bold text-green-700 leading-none">{stats.diverifikasi}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">❌</div>
            <p className="text-[11px] font-medium text-red-700 leading-tight">Ditolak</p>
          </div>
          <p className="text-2xl font-bold text-red-700 leading-none">{stats.ditolak}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari ID, nama pengirim, NIK, atau perihal..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`px-5 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              showFilter
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
            {activeFilterCount > 0 && (
              <span className="bg-white text-purple-600 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilter && (
          <div className="border-t border-gray-100 pt-4 space-y-4 animate-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">📂 Kategori</label>
                <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Semua Kategori</option>
                  {kategoriList.map(k => <option key={k.id_kategori} value={k.nama_kategori}>{k.nama_kategori}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">📌 Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Semua Status</option>
                  <option value="terkirim">🔵 Terkirim</option>
                  <option value="dibaca">🔵 Dibaca</option>
                  <option value="diverifikasi">✅ Diverifikasi</option>
                  <option value="ditolak">❌ Ditolak</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">📤 Metode</label>
                <select value={filterMetode} onChange={e => setFilterMetode(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Semua Metode</option>
                  <option value="scan">📷 Scan</option>
                  <option value="upload">📁 Upload</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">📅 Tahun</label>
                <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Semua Tahun</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">🗓️ Bulan</label>
                <select value={filterBulan} onChange={e => setFilterBulan(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Semua Bulan</option>
                  {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">📆 Dari Tanggal</label>
                <input type="date" value={filterTanggalDari} onChange={e => setFilterTanggalDari(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">📆 Sampai Tanggal</label>
                <input type="date" value={filterTanggalSampai} onChange={e => setFilterTanggalSampai(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Menampilkan <strong className="text-purple-600">{filteredSurat.length}</strong> dari <strong>{allSurat.length}</strong> surat
              </p>
              <button onClick={resetFilters} className="text-xs text-purple-500 hover:text-purple-700 font-semibold">Reset Filter</button>
            </div>
          </div>
        )}
      </div>

      {/* DAFTAR SURAT — CARD */}
      {paginatedSurat.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
          <div className="text-6xl mb-3">📭</div>
          <p className="text-gray-400 font-medium">Tidak ada data surat masuk</p>
          <p className="text-gray-300 text-xs mt-1">Surat akan muncul setelah warga mengirim</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedSurat.map((s, idx) => (
            <div
              key={s.id_surat}
              className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50/20 hover:shadow-lg transition-all duration-200"
            >
              <div className="hidden sm:flex items-center justify-center w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl text-sm font-bold shadow-md flex-shrink-0">
                {(currentPage - 1) * itemsPerPage + idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start sm:items-center gap-2 flex-wrap mb-1.5">
                  <p className="font-mono text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-md">
                    {s.id_surat}
                  </p>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">{s.kategori}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">👤</span>
                  <p className="font-semibold text-gray-800 truncate">{s.nama_pengirim}</p>
                </div>
                <p className="text-xs text-gray-400 font-mono truncate">{s.nik_pengirim}</p>
              </div>

              <div className="flex-1 min-w-0 sm:border-l sm:border-gray-100 sm:pl-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Perihal</p>
                <p className="text-sm text-gray-700 line-clamp-2">{s.perihal}</p>
                <p className="text-xs text-gray-400 mt-1">{s.metode === 'scan' ? '📷 Scan' : '📁 Upload'}</p>
              </div>

              <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 sm:hidden">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusBadge(s.status)}`}>
                  <span>{statusIcon(s.status)}</span>
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

              <div className="flex gap-1.5 flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
                <button
                  onClick={() => { setSelectedSurat(s); setShowDetail(true); }}
                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Detail"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>

                {(s.status === 'terkirim' || s.status === 'dibaca') && (
                  <>
                    <button onClick={() => handleVerifikasi(s.id_surat)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Verifikasi">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button onClick={() => { setSelectedSurat(s); setShowTolak(true); }} className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors" title="Tolak">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}

                <button
                  onClick={() => openDeleteModal(s)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  title="Hapus"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-100 shadow-lg">
          <p className="text-xs text-gray-500">
            Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-xs rounded-lg border border-gray-200 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 text-xs rounded-lg font-semibold ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'border border-gray-200 hover:bg-purple-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-xs rounded-lg border border-gray-200 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DETAIL MODAL SURAT MASUK — DARK THEME (senada Login)         */}
      {/* ============================================================ */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Detail Surat Masuk"
        size="lg"
      >
        {selectedSurat && (
          <div className="space-y-4">

            {/* Status Header — KEEP warna sesuai status */}
            <div className={`rounded-2xl p-5 ${statusBadge(selectedSurat.status)}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Status Surat</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    {statusIcon(selectedSurat.status)} {selectedSurat.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">ID Surat</p>
                  <p className="font-mono text-sm font-bold">{selectedSurat.id_surat}</p>
                </div>
              </div>
            </div>

            {/* ✅ Info Section — DARK CARD + LABEL EMAS */}
            <div className="bg-gray-900 rounded-2xl p-5 space-y-4 border border-gray-700/50">

              {/* Row 1: Pengirim & NIK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">👤 Pengirim</p>
                  <p className="text-sm font-semibold text-white">{selectedSurat.nama_pengirim}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">🆔 NIK</p>
                  <p className="text-sm font-mono text-white">{selectedSurat.nik_pengirim}</p>
                </div>
              </div>

              {/* Row 2: Metode & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">📤 Metode</p>
                  <p className="text-sm font-semibold text-white">
                    {selectedSurat.metode === 'scan' ? '📷 Scan Surat Fisik' : '📁 Upload File'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">📂 Kategori</p>
                  <p className="text-sm font-semibold text-white">{selectedSurat.kategori}</p>
                </div>
              </div>

              {/* Row 3: Perihal */}
              <div>
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">📝 Perihal</p>
                <p className="text-sm font-semibold text-white leading-relaxed">{selectedSurat.perihal}</p>
              </div>

              {/* Row 4: Catatan */}
              {selectedSurat.catatan && (
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">📌 Catatan</p>
                  <p className="text-sm text-gray-200 leading-relaxed bg-white/5 rounded-lg p-3 border border-white/10">
                    {selectedSurat.catatan}
                  </p>
                </div>
              )}

              {/* Row 5: Tanggal Kirim & Verifikasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">📅 Tanggal Kirim</p>
                  <p className="text-sm text-white">
                    {new Date(selectedSurat.tanggal_kirim).toLocaleString('id-ID')}
                  </p>
                </div>
                {selectedSurat.tanggal_verifikasi && (
                  <div>
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">✅ Tanggal Verifikasi</p>
                    <p className="text-sm text-white">
                      {new Date(selectedSurat.tanggal_verifikasi).toLocaleString('id-ID')}
                    </p>
                  </div>
                )}
              </div>

              {/* Row 6: Diverifikasi Oleh */}
              {selectedSurat.diverifikasi_oleh && (
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">👨‍💼 Diverifikasi Oleh</p>
                  <p className="text-sm text-white">{selectedSurat.diverifikasi_oleh}</p>
                </div>
              )}

              {/* Row 7: Alasan Tolak */}
              {selectedSurat.alasan_tolak && (
                <div>
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1.5">❌ Alasan Tolak</p>
                  <p className="text-sm text-red-200 bg-red-500/20 border border-red-500/40 p-3 rounded-lg leading-relaxed">
                    {selectedSurat.alasan_tolak}
                  </p>
                </div>
              )}
            </div>

            {/* Tombol Preview */}
            {selectedSurat.file_url && (
              <div className="pt-2 border-t border-gray-700/50">
                <button
                  onClick={() => handlePreview(selectedSurat)}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview Surat
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
                <p className="text-xs text-gray-400 font-mono truncate">{previewSurat.id_surat}</p>
              </div>
            </div>
            <button
              onClick={handleClosePreview}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
              <FilePreview blobUrl={previewBlobUrl} fileName={previewSurat.file_name || 'file'} originalUrl={previewSurat.file_url} />
            )}
          </div>
        </div>
      )}

      {/* Tolak Modal */}
      <Modal isOpen={showTolak} onClose={() => setShowTolak(false)} title="Tolak Surat">
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <p className="text-sm text-red-300 font-medium">Anda akan menolak surat</p>
            <p className="text-xs text-red-400 mt-1">ID: <strong className="font-mono">{selectedSurat?.id_surat}</strong></p>
            <p className="text-xs text-red-400">Dari: {selectedSurat?.nama_pengirim}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-amber-400 mb-2">
              Alasan Penolakan <span className="text-red-400">*</span>
            </label>
            <textarea
              value={alasanTolak}
              onChange={e => setAlasanTolak(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all resize-none text-sm"
              placeholder="Tuliskan alasan penolakan surat ini..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowTolak(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Batal</button>
            <button onClick={handleTolak} className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 shadow-lg shadow-red-500/30">Tolak Surat</button>
          </div>
        </div>
      </Modal>

      {/* Hapus Modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Hapus Surat Masuk">
        <div className="space-y-4">
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-3xl">🗑️</div>
              <div>
                <p className="font-bold text-red-300">Yakin hapus surat ini?</p>
                <p className="text-xs text-red-400 mt-0.5">Data tidak bisa dikembalikan!</p>
              </div>
            </div>
            {deleteTarget && (
              <div className="bg-gray-900/50 rounded-xl p-3 space-y-1 border border-gray-700/50">
                <p className="text-xs text-amber-400 uppercase tracking-wider">ID Surat</p>
                <p className="font-mono text-sm font-bold text-red-300">{deleteTarget.id_surat}</p>
                <p className="text-xs text-amber-400 uppercase tracking-wider mt-2">Pengirim</p>
                <p className="text-sm font-semibold text-white">{deleteTarget.nama_pengirim}</p>
                <p className="text-xs text-amber-400 uppercase tracking-wider mt-2">Perihal</p>
                <p className="text-sm text-white">{deleteTarget.perihal}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowDelete(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Batal</button>
            <button onClick={handleDelete} disabled={loading} className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 shadow-lg shadow-red-500/30 disabled:opacity-50">
              {loading ? '⏳ Menghapus...' : '🗑️ Hapus Surat'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}