import { useState, useEffect, useMemo } from 'react';
import { SuratMasukDB, KategoriDB, LogDB } from '../store/db';
import { SuratMasuk, User, Kategori } from '../types';
import Modal from '../components/Modal';

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

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      terkirim: 'bg-blue-100 text-blue-700 border border-blue-200',
      dibaca: 'bg-sky-100 text-sky-700 border border-sky-200',
      diverifikasi: 'bg-green-100 text-green-700 border border-green-200',
      ditolak: 'bg-red-100 text-red-700 border border-red-200',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const stats = {
    total: allSurat.length,
    filtered: filteredSurat.length,
    terkirim: allSurat.filter(s => s.status === 'terkirim').length,
    diverifikasi: allSurat.filter(s => s.status === 'diverifikasi').length,
    ditolak: allSurat.filter(s => s.status === 'ditolak').length,
  };

  return (
    <div className="space-y-6">
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm card-hover">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200 card-hover">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Terkirim</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{stats.terkirim}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 border border-green-200 card-hover">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Diverifikasi</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{stats.diverifikasi}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl p-4 border border-red-200 card-hover">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Ditolak</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{stats.ditolak}</p>
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
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
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

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden card-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
              <tr>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">ID Surat</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Pengirim</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Kategori</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Perihal</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Tanggal</th>
                <th className="text-center px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedSurat.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="text-6xl mb-3">📭</div>
                  <p className="text-gray-400 font-medium">Tidak ada data surat masuk</p>
                  <p className="text-gray-300 text-xs mt-1">Surat akan muncul setelah warga mengirim</p>
                </td></tr>
              ) : paginatedSurat.map((s) => (
                <tr key={s.id_surat} className="hover:bg-purple-50/30 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-purple-600 font-semibold">{s.id_surat}</td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-gray-800">{s.nama_pengirim}</p>
                      <p className="text-xs text-gray-400 font-mono">{s.nik_pengirim}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">{s.kategori}</span>
                  </td>
                  <td className="px-5 py-4 max-w-[200px]">
                    <p className="truncate text-gray-700">{s.perihal}</p>
                    <p className="text-xs text-gray-400">{s.metode === 'scan' ? '📷 Scan' : '📁 Upload'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(s.status)}`}>{s.status}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(s.tanggal_kirim).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5 justify-center">
                      <button onClick={() => { setSelectedSurat(s); setShowDetail(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Detail">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {paginatedSurat.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-400 font-medium">Tidak ada data</p>
          </div>
        ) : paginatedSurat.map((s) => (
          <div key={s.id_surat} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 space-y-3 card-hover">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-purple-600 font-semibold">{s.id_surat}</p>
                <p className="font-semibold text-gray-800 truncate mt-1">{s.nama_pengirim}</p>
                <p className="text-xs text-gray-400 font-mono">{s.nik_pengirim}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${statusBadge(s.status)}`}>{s.status}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{s.kategori}</span>
              <span className="text-xs text-gray-400">{s.metode === 'scan' ? '📷' : '📁'}</span>
              <span className="text-xs text-gray-400">{new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}</span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{s.perihal}</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setSelectedSurat(s); setShowDetail(true); }} className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors">
                👁️ Detail
              </button>
              {(s.status === 'terkirim' || s.status === 'dibaca') && (
                <>
                  <button onClick={() => handleVerifikasi(s.id_surat)} className="flex-1 py-2.5 bg-green-50 text-green-600 rounded-xl text-xs font-semibold hover:bg-green-100 transition-colors">
                    ✅ Verifikasi
                  </button>
                  <button onClick={() => { setSelectedSurat(s); setShowTolak(true); }} className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors">
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

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Detail Surat Masuk" size="lg">
        {selectedSurat && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Surat</p><p className="font-mono text-sm font-bold text-purple-600 mt-1">{selectedSurat.id_surat}</p></div>
                <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p><span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(selectedSurat.status)}`}>{selectedSurat.status}</span></div>
                <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pengirim</p><p className="text-sm font-semibold mt-1">{selectedSurat.nama_pengirim}</p></div>
                <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">NIK</p><p className="text-sm font-mono mt-1">{selectedSurat.nik_pengirim}</p></div>
                <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Metode</p><p className="text-sm mt-1">{selectedSurat.metode === 'scan' ? '📷 Scan Surat Fisik' : '📤 Upload File'}</p></div>
                <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</p><p className="text-sm mt-1">{selectedSurat.kategori}</p></div>
                <div className="sm:col-span-2"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Perihal</p><p className="text-sm font-semibold mt-1">{selectedSurat.perihal}</p></div>
                {selectedSurat.catatan && <div className="sm:col-span-2"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Catatan</p><p className="text-sm mt-1">{selectedSurat.catatan}</p></div>}
                <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Kirim</p><p className="text-sm mt-1">{new Date(selectedSurat.tanggal_kirim).toLocaleString('id-ID')}</p></div>
                {selectedSurat.tanggal_verifikasi && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Verifikasi</p><p className="text-sm mt-1">{new Date(selectedSurat.tanggal_verifikasi).toLocaleString('id-ID')}</p></div>}
                {selectedSurat.diverifikasi_oleh && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Diverifikasi Oleh</p><p className="text-sm mt-1">{selectedSurat.diverifikasi_oleh}</p></div>}
                {selectedSurat.alasan_tolak && <div className="sm:col-span-2"><p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Alasan Tolak</p><p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl mt-1">{selectedSurat.alasan_tolak}</p></div>}
              </div>
            </div>
            {selectedSurat.file_url && (
              <a href={selectedSurat.file_url} download={selectedSurat.file_name} className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/30">
                📄 Download File ({selectedSurat.file_name})
              </a>
            )}
          </div>
        )}
      </Modal>

      {/* Tolak Modal */}
      <Modal isOpen={showTolak} onClose={() => setShowTolak(false)} title="Tolak Surat">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <p className="text-sm text-red-700 font-medium">Anda akan menolak surat</p>
            <p className="text-xs text-red-500 mt-1">ID: <strong className="font-mono">{selectedSurat?.id_surat}</strong></p>
            <p className="text-xs text-red-500">Dari: {selectedSurat?.nama_pengirim}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Alasan Penolakan <span className="text-red-500">*</span>
            </label>
            <textarea 
              value={alasanTolak} 
              onChange={e => setAlasanTolak(e.target.value)} 
              rows={4} 
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 resize-none" 
              placeholder="Tuliskan alasan penolakan surat ini..." 
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowTolak(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Batal</button>
            <button onClick={handleTolak} className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 shadow-lg shadow-red-500/30">Tolak Surat</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}