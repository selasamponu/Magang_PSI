import { useState, useEffect } from 'react';
import { SuratMasukDB, SuratKeluarDB, WargaDB, UserDB, LogDB } from '../store/db';
import { SuratMasuk, SuratKeluar, Warga, User, LogAktivitas } from '../types';

interface Props {
  currentUser: User;
}

type LaporanType = 'surat-masuk' | 'surat-keluar' | 'warga' | 'user' | 'log';

export default function LaporanPage({ currentUser }: Props) {
  const [activeTab, setActiveTab] = useState<LaporanType>('surat-masuk');
  const [loading, setLoading] = useState(false);

  // Data
  const [suratMasukList, setSuratMasukList] = useState<SuratMasuk[]>([]);
  const [suratKeluarList, setSuratKeluarList] = useState<SuratKeluar[]>([]);
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [logList, setLogList] = useState<LogAktivitas[]>([]);

  // Filter tanggal
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];
  const [tanggalDari, setTanggalDari] = useState(firstDayOfMonth);
  const [tanggalSampai, setTanggalSampai] = useState(today);
  const [filterStatus, setFilterStatus] = useState('');

  const refresh = async () => {
    try {
      setLoading(true);
      const [masuk, keluar, warga, user, log] = await Promise.all([
        SuratMasukDB.getAll(),
        SuratKeluarDB.getAll(),
        WargaDB.getAll(),
        UserDB.getAll(),
        LogDB.getAll(),
      ]);

      setSuratMasukList(
        masuk.sort((a: SuratMasuk, b: SuratMasuk) =>
          new Date(b.tanggal_kirim).getTime() - new Date(a.tanggal_kirim).getTime()
        )
      );
      setSuratKeluarList(
        keluar.sort((a: SuratKeluar, b: SuratKeluar) =>
          new Date(b.tanggal_kirim).getTime() - new Date(a.tanggal_kirim).getTime()
        )
      );
      setWargaList(warga);
      setUserList(user);
      setLogList(
        log.sort((a: LogAktivitas, b: LogAktivitas) =>
          new Date(b.tanggal_waktu).getTime() - new Date(a.tanggal_waktu).getTime()
        )
      );
    } catch (err) {
      console.error('Error loading laporan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // ================================================================
  // FILTER BY DATE RANGE
  // ================================================================
  const filterByDate = <T extends { tanggal_kirim?: string; tanggal_waktu?: string }>(
    list: T[]
  ): T[] => {
    return list.filter((item) => {
      const tgl = item.tanggal_kirim || item.tanggal_waktu;
      if (!tgl) return true;
      const date = new Date(tgl).toISOString().split('T')[0];
      return date >= tanggalDari && date <= tanggalSampai;
    });
  };

  const filteredSuratMasuk = filterByDate(suratMasukList).filter(
    (s) => !filterStatus || s.status === filterStatus
  );
  const filteredSuratKeluar = filterByDate(suratKeluarList).filter(
    (s) => !filterStatus || s.status === filterStatus
  );
  const filteredLog = filterByDate(logList);

  // ================================================================
  // PRINT HANDLER
  // ================================================================
  const handlePrint = () => {
    window.print();
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'surat-masuk': return 'Laporan Surat Masuk';
      case 'surat-keluar': return 'Laporan Surat Keluar';
      case 'warga': return 'Laporan Data Warga';
      case 'user': return 'Laporan Data User';
      case 'log': return 'Laporan Log Aktivitas';
    }
  };

  const getTotalData = () => {
    switch (activeTab) {
      case 'surat-masuk': return filteredSuratMasuk.length;
      case 'surat-keluar': return filteredSuratKeluar.length;
      case 'warga': return wargaList.length;
      case 'user': return userList.length;
      case 'log': return filteredLog.length;
    }
  };

  return (
    <div className="space-y-6">
      {/* ================================================================
          HEADER (tidak di-print)
      ================================================================ */}
      <div className="print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">📊 Laporan</h1>
            <p className="text-sm text-gray-500 mt-1">
              Cetak & export laporan sistem
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={refresh}
              disabled={loading}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-semibold hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Cetak Laporan
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              onClick={() => { setActiveTab('surat-masuk'); setFilterStatus(''); }}
              className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'surat-masuk'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">📨</span>
              <span className="hidden sm:inline">Surat Masuk</span>
              <span className="sm:hidden">Masuk</span>
            </button>
            <button
              onClick={() => { setActiveTab('surat-keluar'); setFilterStatus(''); }}
              className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'surat-keluar'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">📤</span>
              <span className="hidden sm:inline">Surat Keluar</span>
              <span className="sm:hidden">Keluar</span>
            </button>
            <button
              onClick={() => { setActiveTab('warga'); setFilterStatus(''); }}
              className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'warga'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">👥</span>
              <span>Warga</span>
            </button>
            <button
              onClick={() => { setActiveTab('user'); setFilterStatus(''); }}
              className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'user'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">👨‍💼</span>
              <span>User</span>
            </button>
            <button
              onClick={() => { setActiveTab('log'); setFilterStatus(''); }}
              className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'log'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">📋</span>
              <span className="hidden sm:inline">Log</span>
              <span className="sm:hidden">Log</span>
            </button>
          </div>
        </div>

        {/* Filter Tanggal & Status */}
        {(activeTab === 'surat-masuk' || activeTab === 'surat-keluar' || activeTab === 'log') && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">📅 Dari Tanggal</label>
                <input
                  type="date"
                  value={tanggalDari}
                  onChange={(e) => setTanggalDari(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">📅 Sampai Tanggal</label>
                <input
                  type="date"
                  value={tanggalSampai}
                  onChange={(e) => setTanggalSampai(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              {(activeTab === 'surat-masuk' || activeTab === 'surat-keluar') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">📌 Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  >
                    <option value="">Semua Status</option>
                    {activeTab === 'surat-masuk' ? (
                      <>
                        <option value="terkirim">Terkirim</option>
                        <option value="dibaca">Dibaca</option>
                        <option value="diverifikasi">Diverifikasi</option>
                        <option value="ditolak">Ditolak</option>
                      </>
                    ) : (
                      <>
                        <option value="terkirim">Terkirim</option>
                        <option value="dibaca">Dibaca</option>
                        <option value="selesai">Selesai</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================
          AREA CETAK (print:block)
      ================================================================ */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 print:shadow-none print:border-0 print:rounded-none print:p-0">
        {/* KOP SURAT (tampil saat print) */}
        <div className="hidden print:block border-b-4 border-double border-gray-800 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
            <div className="flex-1 text-center">
              <h2 className="text-lg font-bold uppercase">Pemerintah Daerah Istimewa Yogyakarta</h2>
              <h1 className="text-2xl font-bold uppercase">Kemantren Tegalrejo</h1>
              <p className="text-sm">Jl. Magelang No. 5, Yogyakarta 55252</p>
              <p className="text-xs">Telp: (0274) 123456 | Email: kemantren@tegalrejo.go.id</p>
            </div>
          </div>
        </div>

        {/* JUDUL LAPORAN (tampil saat print) */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold uppercase underline">{getTitle()}</h1>
          <p className="text-sm mt-1">
            Periode: {new Date(tanggalDari).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' '}s/d{' '}
            {new Date(tanggalSampai).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          {filterStatus && <p className="text-sm">Status: {filterStatus}</p>}
        </div>

        {/* INFO (tampil di layar) */}
        <div className="print:hidden mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Laporan Aktif</p>
              <p className="text-lg font-bold text-gray-800 mt-0.5">{getTitle()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Data</p>
              <p className="text-3xl font-bold text-purple-600 mt-0.5">{getTotalData()}</p>
            </div>
          </div>
        </div>

        {/* ============================================================
            TABEL: SURAT MASUK
        ============================================================ */}
        {activeTab === 'surat-masuk' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-200">
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">No</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">ID Surat</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Pengirim</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">NIK</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Kategori</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Perihal</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Status</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuratMasuk.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400 text-sm">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  filteredSuratMasuk.map((s, idx) => (
                    <tr key={s.id_surat} className="hover:bg-gray-50 print:hover:bg-white">
                      <td className="border border-gray-300 px-2 py-2 text-xs">{idx + 1}</td>
                      <td className="border border-gray-300 px-2 py-2 font-mono text-xs">{s.id_surat}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">{s.nama_pengirim}</td>
                      <td className="border border-gray-300 px-2 py-2 font-mono text-xs">{s.nik_pengirim}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">{s.kategori}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">{s.perihal}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs capitalize">{s.status}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs whitespace-nowrap">
                        {new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ============================================================
            TABEL: SURAT KELUAR
        ============================================================ */}
        {activeTab === 'surat-keluar' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-200">
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">No</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">ID Surat</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Penerima</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">NIK</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Nomor Surat</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Perihal</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Status</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuratKeluar.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400 text-sm">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  filteredSuratKeluar.map((s, idx) => (
                    <tr key={s.id_surat_keluar} className="hover:bg-gray-50 print:hover:bg-white">
                      <td className="border border-gray-300 px-2 py-2 text-xs">{idx + 1}</td>
                      <td className="border border-gray-300 px-2 py-2 font-mono text-xs">{s.id_surat_keluar}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">{s.nama_penerima}</td>
                      <td className="border border-gray-300 px-2 py-2 font-mono text-xs">{s.nik_penerima}</td>
                      <td className="border border-gray-300 px-2 py-2 font-mono text-xs">{s.nomor_surat}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">{s.perihal}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs capitalize">{s.status}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs whitespace-nowrap">
                        {new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ============================================================
            TABEL: WARGA
        ============================================================ */}
        {activeTab === 'warga' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-200">
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">No</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">NIK</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Nama Lengkap</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Alamat</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">RT/RW</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">No HP</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {wargaList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400 text-sm">Tidak ada data</td>
                  </tr>
                ) : (
                  wargaList.map((w, idx) => (
                    <tr key={w.nik} className="hover:bg-gray-50 print:hover:bg-white">
                      <td className="border border-gray-300 px-2 py-2 text-xs">{idx + 1}</td>
                      <td className="border border-gray-300 px-2 py-2 font-mono text-xs">{w.nik}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">{w.nama_lengkap}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">{w.alamat}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">{w.rt}/{w.rw}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">{w.no_hp}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs capitalize">{w.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ============================================================
            TABEL: USER
        ============================================================ */}
        {activeTab === 'user' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-200">
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">No</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">ID</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Nama</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Username</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Role</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Status</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Tgl Daftar</th>
                </tr>
              </thead>
              <tbody>
                {userList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400 text-sm">Tidak ada data</td>
                  </tr>
                ) : (
                  userList.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-gray-50 print:hover:bg-white">
                      <td className="border border-gray-300 px-2 py-2 text-xs">{idx + 1}</td>
                      <td className="border border-gray-300 px-2 py-2 font-mono text-xs">#{u.id}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">{u.nama}</td>
                      <td className="border border-gray-300 px-2 py-2 font-mono text-xs">{u.username}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs capitalize">{u.role}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs capitalize">{u.status}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs whitespace-nowrap">
                        {u.tanggal_daftar ? new Date(u.tanggal_daftar).toLocaleDateString('id-ID') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ============================================================
            TABEL: LOG AKTIVITAS
        ============================================================ */}
        {activeTab === 'log' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-200">
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">No</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Waktu</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">User</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Tipe</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Aktivitas</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Detail</th>
                </tr>
              </thead>
              <tbody>
                {filteredLog.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Tidak ada data</td>
                  </tr>
                ) : (
                  filteredLog.slice(0, 200).map((l, idx) => (
                    <tr key={l.id_log} className="hover:bg-gray-50 print:hover:bg-white">
                      <td className="border border-gray-300 px-2 py-2 text-xs">{idx + 1}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs whitespace-nowrap">
                        {new Date(l.tanggal_waktu).toLocaleString('id-ID', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">{l.nama_user}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs capitalize">{l.user_type}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">{l.aktivitas}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">{l.detail}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TANDA TANGAN (tampil saat print) */}
        <div className="hidden print:block mt-10">
          <div className="flex justify-between">
            <div></div>
            <div className="text-center">
              <p className="text-sm">Yogyakarta, {new Date().toLocaleDateString('id-ID', {
                day: '2-digit', month: 'long', year: 'numeric'
              })}</p>
              <p className="text-sm mt-1">Petugas Kemantren</p>
              <div className="h-20"></div>
              <p className="text-sm font-bold underline">{currentUser.nama}</p>
              <p className="text-xs">NIP. ............................</p>
            </div>
          </div>
        </div>

        {/* FOOTER (tampil saat print) */}
        <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center">
          <p className="text-xs text-gray-500">
            Dicetak dari Aplikasi Surat Kemantren Tegalrejo pada {new Date().toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  );
}