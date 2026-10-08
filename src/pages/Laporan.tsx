import { useState, useEffect, useRef } from 'react';
import { SuratMasukDB, SuratKeluarDB, WargaDB, UserDB, LogDB, SettingsDB } from '../store/db';
import { SuratMasuk, SuratKeluar, Warga, User, LogAktivitas } from '../types';

interface Props {
  currentUser: User;
}

type LaporanType = 'surat-masuk' | 'surat-keluar' | 'warga' | 'user' | 'log';

export default function LaporanPage({ currentUser }: Props) {
  const [activeTab, setActiveTab] = useState<LaporanType>('surat-masuk');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

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

  const pdfAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLogo = async () => {
      try {
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

  const getTitle = () => {
    switch (activeTab) {
      case 'surat-masuk': return 'Laporan Surat Masuk';
      case 'surat-keluar': return 'Laporan Surat Keluar';
      case 'warga': return 'Laporan Data Warga';
      case 'user': return 'Laporan Data User';
      case 'log': return 'Laporan Log Aktivitas';
    }
  };

  const getFileName = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    switch (activeTab) {
      case 'surat-masuk': return `Laporan_Surat_Masuk_${dateStr}.pdf`;
      case 'surat-keluar': return `Laporan_Surat_Keluar_${dateStr}.pdf`;
      case 'warga': return `Laporan_Data_Warga_${dateStr}.pdf`;
      case 'user': return `Laporan_Data_User_${dateStr}.pdf`;
      case 'log': return `Laporan_Log_Aktivitas_${dateStr}.pdf`;
    }
  };

  // ================================================================
  // GENERATE PDF
  // ================================================================
  const handleDownloadPDF = async () => {
    if (!pdfAreaRef.current) {
      alert('Area PDF tidak ditemukan');
      return;
    }

    setGenerating(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = pdfAreaRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const marginX = 8;
      const marginY = 10;

      const contentWidth = pageWidth - marginX * 2;
      const contentHeight = pageHeight - marginY * 2;

      const imgRatio = imgWidth / imgHeight;
      const pageRatio = contentWidth / contentHeight;

      let renderWidth: number;
      let renderHeight: number;

      if (imgRatio > pageRatio) {
        renderWidth = contentWidth;
        renderHeight = contentWidth / imgRatio;
      } else {
        renderHeight = contentHeight;
        renderWidth = contentHeight * imgRatio;
      }

      const totalHeightNeeded = (imgHeight / imgWidth) * renderWidth;

      if (totalHeightNeeded <= contentHeight) {
        pdf.addImage(imgData, 'JPEG', marginX, marginY, renderWidth, renderHeight);
      } else {
        const pageCanvasHeight = (contentHeight / contentWidth) * imgWidth;
        let yOffset = 0;
        let pageNum = 0;

        while (yOffset < imgHeight) {
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgWidth;
          pageCanvas.height = Math.min(pageCanvasHeight, imgHeight - yOffset);

          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(
              canvas,
              0,
              yOffset,
              imgWidth,
              pageCanvas.height,
              0,
              0,
              imgWidth,
              pageCanvas.height
            );

            const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
            const pageRenderHeight = (pageCanvas.height / pageCanvas.width) * contentWidth;

            if (pageNum > 0) pdf.addPage();

            pdf.addImage(pageImgData, 'JPEG', marginX, marginY, contentWidth, pageRenderHeight);
          }

          yOffset += pageCanvas.height;
          pageNum++;
        }
      }

      const fileName = getFileName();
      pdf.save(fileName || 'laporan.pdf');
    } catch (err: any) {
      console.error('❌ Gagal generate PDF:', err);
      alert('Gagal membuat PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* HEADER */}
      <div className="print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">📊 Laporan</h1>
            <p className="text-sm text-gray-500 mt-1">Cetak & download laporan dalam format PDF</p>
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
              onClick={handleDownloadPDF}
              disabled={generating}
              className="flex-1 sm:flex-none px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Membuat PDF...
                </>
              ) : (
                <>📥 Download PDF</>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 mt-5">
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

      {/* ================================================================ */}
      {/* AREA PDF — HANYA ini yang di-capture html2canvas                  */}
      {/* ================================================================ */}
      <div
        ref={pdfAreaRef}
        style={{
          width: '794px',
          minHeight: '1123px',
          padding: '40px 45px',
          background: '#ffffff',
          color: '#000000',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '11px',
          lineHeight: '1.5',
          margin: '0 auto',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* KOP SURAT */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          borderBottom: '3px double #000',
          paddingBottom: '14px',
          marginBottom: '20px',
        }}>
          <img
            src={logoUrl}
            alt="Logo"
            crossOrigin="anonymous"
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'contain',
              display: 'block',
              flexShrink: 0,
            }}
            onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
          />
          <div style={{ textAlign: 'center', lineHeight: '1.4' }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, letterSpacing: '0.8px' }}>
              PEMERINTAH KOTA YOGYAKARTA
            </p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', margin: '4px 0 0 0', letterSpacing: '1.2px' }}>
              KEMANTREN TEGALREJO
            </p>
            <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '5px 0 0 0' }}>
              ꦏꦼꦩꦤ꧀ꦠꦿꦺꦤ꧀ ꦠꦼꦒꦭꦿꦺꦗꦺꦴ
            </p>
            <p style={{ fontSize: '10px', margin: '6px 0 0 0' }}>
              Jalan Tompeyan TR III/219, Yogyakarta 55244 | Telp (0274) 515781
            </p>
            <p style={{ fontSize: '9px', margin: '3px 0 0 0' }}>
              Laman tegalrejokec.jogjakota.go.id | Pos-el tr@jogjakota.go.id
            </p>
          </div>
        </div>

        {/* JUDUL LAPORAN */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            textDecoration: 'underline',
            margin: 0,
            letterSpacing: '0.5px',
          }}>
            {getTitle()}
          </h1>
          <p style={{ fontSize: '11px', marginTop: '8px', marginBottom: 0 }}>
            Periode: {new Date(tanggalDari).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' '}s/d{' '}
            {new Date(tanggalSampai).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          {filterStatus && (
            <p style={{ fontSize: '11px', marginTop: '4px', marginBottom: 0 }}>
              Status: <strong>{filterStatus}</strong>
            </p>
          )}
        </div>

        {/* ============= TABEL SURAT MASUK ============= */}
        {activeTab === 'surat-masuk' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '4%' }}>No</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '14%' }}>ID Surat</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '14%' }}>Pengirim</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '14%' }}>NIK</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '12%' }}>Kategori</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '18%' }}>Perihal</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '11%' }}>Status</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '13%' }}>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuratMasuk.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ border: '1px solid #333', padding: '20px', textAlign: 'center', color: '#999' }}>
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                filteredSuratMasuk.map((s, idx) => (
                  <tr key={s.id_surat}>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '9px', fontFamily: 'monospace' }}>{s.id_surat}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px' }}>{s.nama_pengirim}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '9px', fontFamily: 'monospace' }}>{s.nik_pengirim}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px' }}>{s.kategori}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px' }}>{s.perihal}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px', textAlign: 'center', textTransform: 'capitalize' }}>{s.status}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px', whiteSpace: 'nowrap' }}>
                      {new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* ============= TABEL SURAT KELUAR ============= */}
        {activeTab === 'surat-keluar' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '4%' }}>No</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '14%' }}>ID Surat</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '14%' }}>Penerima</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '14%' }}>NIK</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '12%' }}>Nomor</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '18%' }}>Perihal</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '11%' }}>Status</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '13%' }}>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuratKeluar.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ border: '1px solid #333', padding: '20px', textAlign: 'center', color: '#999' }}>
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                filteredSuratKeluar.map((s, idx) => (
                  <tr key={s.id_surat_keluar}>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '9px', fontFamily: 'monospace' }}>{s.id_surat_keluar}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px' }}>{s.nama_penerima}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '9px', fontFamily: 'monospace' }}>{s.nik_penerima}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '9px', fontFamily: 'monospace' }}>{s.nomor_surat}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px' }}>{s.perihal}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px', textAlign: 'center', textTransform: 'capitalize' }}>{s.status}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px', whiteSpace: 'nowrap' }}>
                      {new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* ============= TABEL WARGA ============= */}
        {activeTab === 'warga' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '5%' }}>No</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '16%' }}>NIK</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '20%' }}>Nama Lengkap</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '24%' }}>Alamat</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '8%' }}>RT/RW</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '15%' }}>No HP</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '12%' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {wargaList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ border: '1px solid #333', padding: '20px', textAlign: 'center', color: '#999' }}>
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                wargaList.map((w, idx) => (
                  <tr key={w.nik}>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '9px', fontFamily: 'monospace' }}>{w.nik}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px' }}>{w.nama_lengkap}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px' }}>{w.alamat}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px', textAlign: 'center' }}>{w.rt}/{w.rw}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px' }}>{w.no_hp}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px', textAlign: 'center', textTransform: 'capitalize' }}>{w.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* ============= TABEL USER ============= */}
        {activeTab === 'user' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '5%' }}>No</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '8%' }}>ID</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '22%' }}>Nama</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '20%' }}>Username</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '15%' }}>Role</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '12%' }}>Status</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '18%' }}>Tgl Daftar</th>
              </tr>
            </thead>
            <tbody>
              {userList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ border: '1px solid #333', padding: '20px', textAlign: 'center', color: '#999' }}>
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                userList.map((u, idx) => (
                  <tr key={u.id}>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '9px', fontFamily: 'monospace', textAlign: 'center' }}>#{u.id}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px' }}>{u.nama}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '9px', fontFamily: 'monospace' }}>{u.username}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px', textAlign: 'center', textTransform: 'capitalize' }}>{u.role}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px', textAlign: 'center', textTransform: 'capitalize' }}>{u.status}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px', whiteSpace: 'nowrap' }}>
                      {u.tanggal_daftar ? new Date(u.tanggal_daftar).toLocaleDateString('id-ID') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* ============= TABEL LOG ============= */}
        {activeTab === 'log' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '5%' }}>No</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '20%' }}>Waktu</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '18%' }}>User</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '17%' }}>Aktivitas</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', background: '#e5e7eb', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', width: '40%' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {filteredLog.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ border: '1px solid #333', padding: '20px', textAlign: 'center', color: '#999' }}>
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                filteredLog.map((l, idx) => (
                  <tr key={l.id_log}>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px', whiteSpace: 'nowrap' }}>
                      {new Date(l.tanggal_waktu).toLocaleString('id-ID', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px' }}>{l.nama_user}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px' }}>{l.aktivitas}</td>
                    <td style={{ border: '1px solid #333', padding: '8px 6px', fontSize: '10px' }}>{l.detail}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* TANDA TANGAN */}
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center', fontSize: '11px', lineHeight: '1.7' }}>
            <p style={{ margin: 0 }}>
              Yogyakarta, {new Date().toLocaleDateString('id-ID', {
                day: '2-digit', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{
          marginTop: '30px',
          paddingTop: '10px',
          borderTop: '1px solid #666',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '9px', color: '#666', margin: 0 }}>
            Surat Kemantren Tegalrejo Yogyakarta — {new Date().toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  );
}