import { useState, useEffect, useMemo } from 'react';
import { SuratMasukDB, KategoriDB, LogDB } from '../store/db';
import { SuratMasuk, User } from '../types';
import Modal from '../components/Modal';

interface Props {
  currentUser: User;
}

export default function SuratMasukPage({ currentUser }: Props) {
  const [allSurat, setAllSurat] = useState<SuratMasuk[]>([]);
  const [selectedSurat, setSelectedSurat] = useState<SuratMasuk | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showTolak, setShowTolak] = useState(false);
  const [alasanTolak, setAlasanTolak] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  // Filter states
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMetode, setFilterMetode] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTanggalDari, setFilterTanggalDari] = useState('');
  const [filterTanggalSampai, setFilterTanggalSampai] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const kategoriList = KategoriDB.getAll();

  // Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set(allSurat.map(s => new Date(s.tanggal_kirim).getFullYear().toString()));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [allSurat]);

  const months = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const refresh = () => {
    const data = SuratMasukDB.getAll();
    setAllSurat(data.sort((a, b) => new Date(b.tanggal_kirim).getTime() - new Date(a.tanggal_kirim).getTime()));
  };

  useEffect(() => { refresh(); }, []);

  // Filtered data
  const filteredSurat = useMemo(() => {
    let data = [...allSurat];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(s =>
        s.nama_pengirim.toLowerCase().includes(q) ||
        s.id_surat.toLowerCase().includes(q) ||
        s.perihal.toLowerCase().includes(q) ||
        s.nik_pengirim.includes(q)
      );
    }

    // Category filter
    if (filterKategori) {
      data = data.filter(s => s.kategori === filterKategori);
    }

    // Status filter
    if (filterStatus) {
      data = data.filter(s => s.status === filterStatus);
    }

    // Method filter
    if (filterMetode) {
      data = data.filter(s => s.metode === filterMetode);
    }

    // Year filter
    if (filterTahun) {
      data = data.filter(s => new Date(s.tanggal_kirim).getFullYear().toString() === filterTahun);
    }

    // Month filter
    if (filterBulan) {
      data = data.filter(s => (new Date(s.tanggal_kirim).getMonth() + 1).toString() === filterBulan);
    }

    // Date range filter
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

  // Pagination
  const totalPages = Math.ceil(filteredSurat.length / itemsPerPage);
  const paginatedSurat = filteredSurat.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [search, filterKategori, filterStatus, filterMetode, filterTahun, filterBulan, filterTanggalDari, filterTanggalSampai]);

  const resetFilters = () => {
    setSearch('');
    setFilterKategori('');
    setFilterStatus('');
    setFilterMetode('');
    setFilterTahun('');
    setFilterBulan('');
    setFilterTanggalDari('');
    setFilterTanggalSampai('');
  };

  const activeFilterCount = [filterKategori, filterStatus, filterMetode, filterTahun, filterBulan, filterTanggalDari, filterTanggalSampai].filter(Boolean).length;

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
      terkirim: 'bg-blue-100 text-blue-700 border border-blue-200',
      dibaca: 'bg-sky-100 text-sky-700 border border-sky-200',
      diverifikasi: 'bg-green-100 text-green-700 border border-green-200',
      ditolak: 'bg-red-100 text-red-700 border border-red-200',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  // Stats for filter summary
  const stats = {
    total: allSurat.length,
    filtered: filteredSurat.length,
    terkirim: allSurat.filter(s => s.status === 'terkirim').length,
    diverifikasi: allSurat.filter(s => s.status === 'diverifikasi').length,
    ditolak: allSurat.filter(s => s.status === 'ditolak').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">📨 Surat Masuk</h1>
            <p className="text-sm text-gray-500">Kelola dan verifikasi surat masuk dari warga</p>
          </div>
          <button onClick={refresh} className="w-full sm:w-auto px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg sm:text-xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <p className="text-xs text-blue-600">Terkirim</p>
            <p className="text-lg sm:text-xl font-bold text-blue-700">{stats.terkirim}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 border border-green-100">
            <p className="text-xs text-green-600">Diverifikasi</p>
            <p className="text-lg sm:text-xl font-bold text-green-700">{stats.diverifikasi}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 border border-red-100">
            <p className="text-xs text-red-600">Ditolak</p>
            <p className="text-lg sm:text-xl font-bold text-red-700">{stats.ditolak}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Cari ID, nama pengirim, NIK, atau perihal..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
            />
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${showFilter ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filter
            {activeFilterCount > 0 && (
              <span className="bg-white text-indigo-600 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Advanced Filter Panel */}
        {showFilter && (
          <div className="border-t border-gray-100 pt-3 space-y-3 animate-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Kategori */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">📂 Kategori</label>
                <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  <option value="">Semua Kategori</option>
                  {kategoriList.map(k => <option key={k.id_kategori} value={k.nama_kategori}>{k.nama_kategori}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">📌 Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  <option value="">Semua Status</option>
                  <option value="terkirim">🔵 Terkirim</option>
                  <option value="dibaca">🔵 Dibaca</option>
                  <option value="diverifikasi">✅ Diverifikasi</option>
                  <option value="ditolak">❌ Ditolak</option>
                </select>
              </div>

              {/* Metode */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">📤 Metode</label>
                <select value={filterMetode} onChange={e => setFilterMetode(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  <option value="">Semua Metode</option>
                  <option value="scan">📷 Scan</option>
                  <option value="upload">📁 Upload</option>
                </select>
              </div>

              {/* Tahun */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">📅 Tahun</label>
                <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  <option value="">Semua Tahun</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Bulan */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">🗓️ Bulan</label>
                <select value={filterBulan} onChange={e => setFilterBulan(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  <option value="">Semua Bulan</option>
                  {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              {/* Tanggal Dari */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">📆 Dari Tanggal</label>
                <input type="date" value={filterTanggalDari} onChange={e => setFilterTanggalDari(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>

              {/* Tanggal Sampai */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">📆 Sampai Tanggal</label>
                <input type="date" value={filterTanggalSampai} onChange={e => setFilterTanggalSampai(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>

            {/* Active Filter Tags */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500 self-center">Filter aktif:</span>
                {filterKategori && <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center gap-1">{filterKategori} <button onClick={() => setFilterKategori('')}>×</button></span>}
                {filterStatus && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">{filterStatus} <button onClick={() => setFilterStatus('')}>×</button></span>}
                {filterMetode && <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs flex items-center gap-1">{filterMetode} <button onClick={() => setFilterMetode('')}>×</button></span>}
                {filterTahun && <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center gap-1">{filterTahun} <button onClick={() => setFilterTahun('')}>×</button></span>}
                {filterBulan && <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs flex items-center gap-1">{months.find(m => m.value === filterBulan)?.label} <button onClick={() => setFilterBulan('')}>×</button></span>}
                {filterTanggalDari && <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center gap-1">Dari: {filterTanggalDari} <button onClick={() => setFilterTanggalDari('')}>×</button></span>}
                {filterTanggalSampai && <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center gap-1">Sampai: {filterTanggalSampai} <button onClick={() => setFilterTanggalSampai('')}>×</button></span>}
                <button onClick={resetFilters} className="px-2 py-1 text-red-500 text-xs hover:text-red-700 font-medium">Reset Semua</button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">
                Menampilkan <strong>{filteredSurat.length}</strong> dari <strong>{allSurat.length}</strong> surat
              </p>
              <button onClick={resetFilters} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">Reset Filter</button>
            </div>
          </div>
        )}
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">ID Surat</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Pengirim</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Kategori</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Perihal</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Tanggal</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedSurat.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <div className="text-gray-400">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="font-medium">Tidak ada data</p>
                    <p className="text-xs mt-1">Coba ubah filter pencarian Anda</p>
                  </div>
                </td></tr>
              ) : paginatedSurat.map((s) => (
                <tr key={s.id_surat} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">{s.id_surat}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{s.nama_pengirim}</p>
                      <p className="text-xs text-gray-400 font-mono">{s.nik_pengirim}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">{s.kategori}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="truncate text-gray-700">{s.perihal}</p>
                    <p className="text-xs text-gray-400">{s.metode === 'scan' ? '📷 Scan' : '📁 Upload'}</p>
                  </td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(s.status)}`}>{s.status}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(s.tanggal_kirim).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => { setSelectedSurat(s); setShowDetail(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Detail">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      {(s.status === 'terkirim' || s.status === 'dibaca') && (
                        <>
                          <button onClick={() => handleVerifikasi(s.id_surat)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Verifikasi">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button onClick={() => { setSelectedSurat(s); setShowTolak(true); }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Tolak">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
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

      {/* Card List - Mobile */}
      <div className="md:hidden space-y-3">
        {paginatedSurat.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-gray-400 font-medium">Tidak ada data</p>
          </div>
        ) : paginatedSurat.map((s) => (
          <div key={s.id_surat} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-indigo-600">{s.id_surat}</p>
                <p className="font-medium text-gray-800 truncate">{s.nama_pengirim}</p>
                <p className="text-xs text-gray-400 font-mono">{s.nik_pengirim}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${statusBadge(s.status)}`}>{s.status}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{s.kategori}</span>
              <span className="text-xs text-gray-400">{s.metode === 'scan' ? '📷' : '📁'}</span>
              <span className="text-xs text-gray-400">{new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}</span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{s.perihal}</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setSelectedSurat(s); setShowDetail(true); }} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 text-center">
                👁️ Detail
              </button>
              {(s.status === 'terkirim' || s.status === 'dibaca') && (
                <>
                  <button onClick={() => handleVerifikasi(s.id_surat)} className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 text-center">
                    ✅ Verifikasi
                  </button>
                  <button onClick={() => { setSelectedSurat(s); setShowTolak(true); }} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 text-center">
                    ❌ Tolak
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">
            Halaman {currentPage} dari {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-xs rounded-lg ${currentPage === page ? 'bg-indigo-500 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Detail Surat Masuk" size="lg">
        {selectedSurat && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500 uppercase tracking-wider">ID Surat</p><p className="font-mono text-sm font-medium text-indigo-600">{selectedSurat.id_surat}</p></div>
                <div><p className="text-xs text-gray-500 uppercase tracking-wider">Status</p><span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(selectedSurat.status)}`}>{selectedSurat.status}</span></div>
                <div><p className="text-xs text-gray-500 uppercase tracking-wider">Pengirim</p><p className="text-sm font-medium">{selectedSurat.nama_pengirim}</p></div>
                <div><p className="text-xs text-gray-500 uppercase tracking-wider">NIK</p><p className="text-sm font-mono">{selectedSurat.nik_pengirim}</p></div>
                <div><p className="text-xs text-gray-500 uppercase tracking-wider">Metode</p><p className="text-sm">{selectedSurat.metode === 'scan' ? '📷 Scan Surat Fisik' : '📤 Upload File'}</p></div>
                <div><p className="text-xs text-gray-500 uppercase tracking-wider">Kategori</p><p className="text-sm">{selectedSurat.kategori}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-gray-500 uppercase tracking-wider">Perihal</p><p className="text-sm font-medium">{selectedSurat.perihal}</p></div>
                {selectedSurat.catatan && <div className="sm:col-span-2"><p className="text-xs text-gray-500 uppercase tracking-wider">Catatan</p><p className="text-sm">{selectedSurat.catatan}</p></div>}
                <div><p className="text-xs text-gray-500 uppercase tracking-wider">Tanggal Kirim</p><p className="text-sm">{new Date(selectedSurat.tanggal_kirim).toLocaleString('id-ID')}</p></div>
                {selectedSurat.tanggal_verifikasi && <div><p className="text-xs text-gray-500 uppercase tracking-wider">Tanggal Verifikasi</p><p className="text-sm">{new Date(selectedSurat.tanggal_verifikasi).toLocaleString('id-ID')}</p></div>}
                {selectedSurat.diverifikasi_oleh && <div><p className="text-xs text-gray-500 uppercase tracking-wider">Diverifikasi Oleh</p><p className="text-sm">{selectedSurat.diverifikasi_oleh}</p></div>}
                {selectedSurat.alasan_tolak && <div className="sm:col-span-2"><p className="text-xs text-red-500 uppercase tracking-wider">Alasan Tolak</p><p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{selectedSurat.alasan_tolak}</p></div>}
              </div>
            </div>
            {selectedSurat.file_url && (
              <a href={selectedSurat.file_url} download={selectedSurat.file_name} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-sm hover:bg-indigo-100 transition-colors font-medium">
                📄 Download File ({selectedSurat.file_name})
              </a>
            )}
          </div>
        )}
      </Modal>

      {/* Tolak Modal */}
      <Modal isOpen={showTolak} onClose={() => setShowTolak(false)} title="Tolak Surat">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="text-sm text-red-700">Anda akan menolak surat <strong className="font-mono">{selectedSurat?.id_surat}</strong></p>
            <p className="text-xs text-red-500 mt-1">dari {selectedSurat?.nama_pengirim}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Penolakan <span className="text-red-500">*</span></label>
            <textarea value={alasanTolak} onChange={e => setAlasanTolak(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300" placeholder="Tuliskan alasan penolakan surat ini..." />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowTolak(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 font-medium">Batal</button>
            <button onClick={handleTolak} className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 font-medium shadow-sm">Tolak Surat</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
