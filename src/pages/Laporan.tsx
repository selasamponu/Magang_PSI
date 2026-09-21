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

  const [suratMasukList, setSuratMasukList] = useState<SuratMasuk[]>([]);
  const [suratKeluarList, setSuratKeluarList] = useState<SuratKeluar[]>([]);
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [logList, setLogList] = useState<LogAktivitas[]>([]);

  const [logoUrl, setLogoUrl] = useState('/logo.png');

  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];
  const [tanggalDari, setTanggalDari] = useState(firstDayOfMonth);
  const [tanggalSampai, setTanggalSampai] = useState(today);
  const [filterStatus, setFilterStatus] = useState('');

  const [ttd, setTtd] = useState({
    jabatan: 'Kepala Kemantren Tegalrejo',
    nama: '',
    nip: '',
    kota: 'Yogyakarta',
  });

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const { SettingsDB } = await import('../store/db');
        const data = await SettingsDB.get();
        if (data?.logo_url) {
          const fullUrl = data.logo_url.startsWith('/uploads/')
            ? `http://${window.location.hostname}:5000${data.logo_url}`
            : data.logo_url;
          setLogoUrl(fullUrl);
        }
      } catch (err) {
        console.error('Error loading logo:', err);
      }
    };
    loadLogo();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('laporan_ttd');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTtd(parsed);
      } catch (e) {
        console.error(e);
      }
    } else {
      setTtd((prev) => ({ ...prev, nama: currentUser.nama }));
    }
  }, [currentUser.nama]);

  useEffect(() => {
    localStorage.setItem('laporan_ttd', JSON.stringify(ttd));
  }, [ttd]);

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
      {/* HEADER */}
      <div className="print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">📊 Laporan</h1>
            <p className="text-sm text-gray-500 mt-1">Cetak & export laporan sistem</p>
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
              🖨️ Cetak Laporan
            </button>
          </div>
        </div>

        {/* FORM TANDA TANGAN */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mt-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            ✍️ Pengaturan Tanda Tangan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jabatan</label>
              <input
                type="text"
                value={ttd.jabatan}
                onChange={(e) => setTtd({ ...ttd, jabatan: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Kepala Kemantren Tegalrejo"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Penandatangan</label>
              <input
                type="text"
                value={ttd.nama}
                onChange={(e) => setTtd({ ...ttd, nama: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Masukkan nama"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">NIP</label>
              <input
                type="text"
                value={ttd.nip}
                onChange={(e) => setTtd({ ...ttd, nip: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="NIP. 123456789"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kota</label>
              <input
                type="text"
                value={ttd.kota}
                onChange={(e) => setTtd({ ...ttd, kota: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Yogyakarta"
              />
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            💡 Nama ini akan tampil di tanda tangan laporan. Otomatis tersimpan di browser.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              onClick={() => { setActiveTab('surat-masuk'); setFilterStatus(''); }}
              className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'surat-masuk'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              📨 <span className="hidden sm:inline">Surat Masuk</span>
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
              📤 <span className="hidden sm:inline">Surat Keluar</span>
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
              👥 Warga
            </button>
            <button
              onClick={() => { setActiveTab('user'); setFilterStatus(''); }}
              className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'user'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              👨‍💼 User
            </button>
            <button
              onClick={() => { setActiveTab('log'); setFilterStatus(''); }}
              className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'log'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              📋 Log
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

      {/* AREA CETAK */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 print:shadow-none print:border-0 print:rounded-none print:p-0">

        {/* ============================================================
            KOP SURAT — logo + teks di TENGAH, teks rata tengah
            Diberikan padding bottom yang lebih besar agar tidak berdempetan
        ============================================================ */}
        <div className="hidden print:block border-b-2 border-gray-800 pb-4 mb-6">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '15px', // Jarak antara logo dan teks
            }}
          >
            {/* LOGO */}
            <div style={{ flexShrink: 0 }}>
              <img
                src={logoUrl}
                alt="Logo"
                style={{
                  width: '70px', // Sedikit diperbesar
                  height: '70px',
                  objectFit: 'contain',
                  display: 'block',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>

            {/* TEKS KOP — RATA TENGAH */}
            <div style={{ textAlign: 'center', lineHeight: '1.4' }}> {/* Line height ditambah */}
              <h2 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, color: '#000' }}>
                PEMERINTAH KOTA YOGYAKARTA
              </h2>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', margin: '3px 0 0 0', color: '#000' }}>
                KEMANTREN TEGALREJO
              </h1>
              <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#000' }}>
                ꦏꦼꦩꦤ꧀ꦠꦿꦺꦤ꧀ ꦠꦼꦒꦭꦿꦺꦗꦺꦴ
              </p>
              <p style={{ fontSize: '9px', margin: '5px 0 0 0', color: '#000' }}>
                Jalan Tompeyan TR III/219, Yogyakarta 55244 | Telp (0274) 515781
              </p>
              <p style={{ fontSize: '8px', margin: '2px 0 0 0', color: '#000' }}>
                Laman tegalrejokec.jogjakota.go.id | Pos-el tr@jogjakota.go.id
              </p>
            </div>
          </div>
        </div>

        {/* JUDUL LAPORAN — Diberikan margin bottom lebih */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-lg font-bold uppercase underline">{getTitle()}</h1>
          <p className="text-[11px] mt-2">
            Periode: {new Date(tanggalDari).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' '}s/d{' '}
            {new Date(tanggalSampai).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          {filterStatus && <p className="text-[11px] mt-1">Status: {filterStatus}</p>}
        </div>

        {/* INFO */}
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

        {/* TABEL SURAT MASUK */}
        {activeTab === 'surat-masuk' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">No</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">ID Surat</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Pengirim</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">NIK</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Kategori</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Perihal</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Status</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuratMasuk.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-3 text-gray-400">Tidak ada data</td>
                  </tr>
                ) : (
                  filteredSuratMasuk.slice(0, 15).map((s, idx) => (
                    <tr key={s.id_surat} className="hover:bg-gray-50">
                      <td className="border border-gray-400 px-1 py-0.5">{idx + 1}</td>
                      <td className="border border-gray-400 px-1 py-0.5 font-mono">{s.id_surat}</td>
                      <td className="border border-gray-400 px-1 py-0.5">{s.nama_pengirim}</td>
                      <td className="border border-gray-400 px-1 py-0.5 font-mono">{s.nik_pengirim}</td>
                      <td className="border border-gray-400 px-1 py-0.5">{s.kategori}</td>
                      <td className="border border-gray-400 px-1 py-0.5">{s.perihal}</td>
                      <td className="border border-gray-400 px-1 py-0.5 capitalize">{s.status}</td>
                      <td className="border border-gray-400 px-1 py-0.5 whitespace-nowrap">
                        {new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABEL SURAT KELUAR */}
        {activeTab === 'surat-keluar' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">No</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">ID Surat</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Penerima</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">NIK</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Nomor Surat</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Perihal</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Status</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuratKeluar.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-3 text-gray-400">Tidak ada data</td>
                  </tr>
                ) : (
                  filteredSuratKeluar.slice(0, 15).map((s, idx) => (
                    <tr key={s.id_surat_keluar} className="hover:bg-gray-50">
                      <td className="border border-gray-400 px-1 py-0.5">{idx + 1}</td>
                      <td className="border border-gray-400 px-1 py-0.5 font-mono">{s.id_surat_keluar}</td>
                      <td className="border border-gray-400 px-1 py-0.5">{s.nama_penerima}</td>
                      <td className="border border-gray-400 px-1 py-0.5 font-mono">{s.nik_penerima}</td>
                      <td className="border border-gray-400 px-1 py-0.5 font-mono">{s.nomor_surat}</td>
                      <td className="border border-gray-400 px-1 py-0.5">{s.perihal}</td>
                      <td className="border border-gray-400 px-1 py-0.5 capitalize">{s.status}</td>
                      <td className="border border-gray-400 px-1 py-0.5 whitespace-nowrap">
                        {new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABEL WARGA */}
        {activeTab === 'warga' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">No</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">NIK</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Nama Lengkap</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Alamat</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">RT/RW</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">No HP</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {wargaList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-3 text-gray-400">Tidak ada data</td>
                  </tr>
                ) : (
                  wargaList.slice(0, 15).map((w, idx) => (
                    <tr key={w.nik} className="hover:bg-gray-50">
                      <td className="border border-gray-400 px-1 py-0.5">{idx + 1}</td>
                      <td className="border border-gray-400 px-1 py-0.5 font-mono">{w.nik}</td>
                      <td className="border border-gray-400 px-1 py-0.5">{w.nama_lengkap}</td>
                      <td className="border border-gray-400 px-1 py-0.5">{w.alamat}</td>
                      <td className="border border-gray-400 px-1 py-0.5">{w.rt}/{w.rw}</td>
                      <td className="border border-gray-400 px-1 py-0.5">{w.no_hp}</td>
                      <td className="border border-gray-400 px-1 py-0.5 capitalize">{w.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABEL USER */}
        {activeTab === 'user' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">No</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">ID</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Nama</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Username</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Role</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Status</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Tgl Daftar</th>
                </tr>
              </thead>
              <tbody>
                {userList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-3 text-gray-400">Tidak ada data</td>
                  </tr>
                ) : (
                  userList.slice(0, 15).map((u, idx) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="border border-gray-400 px-1 py-0.5">{idx + 1}</td>
                      <td className="border border-gray-400 px-1 py-0.5 font-mono">#{u.id}</td>
                      <td className="border border-gray-400 px-1 py-0.5">{u.nama}</td>
                      <td className="border border-gray-400 px-1 py-0.5 font-mono">{u.username}</td>
                      <td className="border border-gray-400 px-1 py-0.5 capitalize">{u.role}</td>
                      <td className="border border-gray-400 px-1 py-0.5 capitalize">{u.status}</td>
                      <td className="border border-gray-400 px-1 py-0.5 whitespace-nowrap">
                        {u.tanggal_daftar ? new Date(u.tanggal_daftar).toLocaleDateString('id-ID') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABEL LOG */}
        {activeTab === 'log' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">No</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Waktu</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">User</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Aktivitas</th>
                  <th className="border border-gray-400 px-1 py-1 text-left font-bold">Detail</th>
                </tr>
              </thead>
              <tbody>
                {filteredLog.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-3 text-gray-400">Tidak ada data</td>
                  </tr>
                ) : (
                  filteredLog.slice(0, 15).map((l, idx) => (
                    <tr key={l.id_log} className="hover:bg-gray-50">
                      <td className="border border-gray-400 px-1 py-0.5">{idx + 1}</td>
                      <td className="border border-gray-400 px-1 py-0.5 whitespace-nowrap">
                        {new Date(l.tanggal_waktu).toLocaleString('id-ID', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="border border-gray-400 px-1 py-0.5">{l.nama_user}</td>
                      <td className="border border-gray-400 px-1 py-0.5">{l.aktivitas}</td>
                      <td className="border border-gray-400 px-1 py-0.5">{l.detail}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TANDA TANGAN — Diberikan margin top yang lebih besar */}
        <div className="hidden print:block mt-10">
          <div className="flex justify-end">
            <div className="text-center" style={{ fontSize: '11px', lineHeight: '1.6' }}>
              <p>
                {ttd.kota}, {new Date().toLocaleDateString('id-ID', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </p>
              <p className="mt-1">{ttd.jabatan}</p>
              <div className="h-12"></div> {/* Ruang untuk tanda tangan */}
              <p className="font-bold underline">{ttd.nama || currentUser.nama}</p>
              <p className="text-[10px] mt-0.5">{ttd.nip || 'NIP. ............................'}</p>
            </div>
          </div>
        </div>

        {/* FOOTER — Diberikan margin top */}
        <div className="hidden print:block mt-6 pt-2 border-t border-gray-300 text-center">
          <p className="text-[8px] text-gray-500">
            Surat Kemantren Tegalrejo Yogyakarta — {new Date().toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  );
}