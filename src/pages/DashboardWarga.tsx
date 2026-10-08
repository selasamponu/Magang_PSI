import { useState, useEffect } from 'react';
import { getDashboardStats, SuratMasukDB } from '../store/db';
import { Warga, SuratMasuk } from '../types';

interface Props {
  warga: Warga;
}

const defaultStats = {
  totalSurat: 0,
  menunggu: 0,
  diverifikasi: 0,
  ditolak: 0,
};

export default function DashboardWarga({ warga }: Props) {
  const [stats, setStats] = useState<any>(defaultStats);
  const [recentSurat, setRecentSurat] = useState<SuratMasuk[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      const statsData = await getDashboardStats('warga', warga.nik);
      setStats(statsData);

      const my = await SuratMasukDB.getByNik(warga.nik);
      setRecentSurat(
        my
          .sort((a: SuratMasuk, b: SuratMasuk) =>
            new Date(b.tanggal_kirim).getTime() - new Date(a.tanggal_kirim).getTime()
          )
          .slice(0, 8)
      );
    } catch (err) {
      console.error('Error dashboard warga:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

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
      terkirim: '📤',
      dibaca: '👁️',
      diverifikasi: '✅',
      ditolak: '❌',
    };
    return map[status] || '📄';
  };

  const cards = [
    { icon: '📨', label: 'Surat Saya', value: stats.totalSurat, bg: 'bg-blue-50', border: 'border-blue-200', color: 'from-blue-500 to-blue-600', textColor: 'text-blue-700' },
    { icon: '⏳', label: 'Diproses', value: stats.menunggu, bg: 'bg-yellow-50', border: 'border-yellow-200', color: 'from-yellow-500 to-orange-500', textColor: 'text-yellow-700' },
    { icon: '✅', label: 'Diverifikasi', value: stats.diverifikasi, bg: 'bg-green-50', border: 'border-green-200', color: 'from-green-500 to-emerald-600', textColor: 'text-green-700' },
    { icon: '❌', label: 'Ditolak', value: stats.ditolak, bg: 'bg-red-50', border: 'border-red-200', color: 'from-red-500 to-rose-600', textColor: 'text-red-700' },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#7C2D12] via-[#8B3A1A] to-[#7C2D12] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-10 -bottom-10 w-52 h-52 bg-white/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg animate-float">
              👋
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-md">Halo, {warga.nama_lengkap}!</h1>
              <p className="text-white/90 text-sm mt-0.5">Selamat datang di Aplikasi Surat Kemantren Tegalrejo Yogyakarta</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
              </svg>
              NIK: {warga.nik}
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              RT {warga.rt} / RW {warga.rw}
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Ringkasan Surat Saya</h2>
          <p className="text-sm text-gray-600 mt-1">Status surat yang Anda kirim</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-[#7C2D12] to-[#8B3A1A] text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-[#7C2D12]/30 flex items-center justify-center gap-2 disabled:opacity-50 hover-scale"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* KPI CARDS — KECIL & RAPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`${card.bg} rounded-xl p-3 border ${card.border} hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-sm shadow-sm flex-shrink-0`}>
                {card.icon}
              </div>
              <p className={`text-[11px] font-medium ${card.textColor} leading-tight`}>{card.label}</p>
            </div>
            <p className={`text-2xl font-bold ${card.textColor} leading-none`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* SURAT TERBARU — CARD PER BARIS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50/40 to-orange-50/40">
          <h2 className="font-bold text-gray-800 flex items-center gap-2 text-base">
            <span className="text-lg">📜</span>
            Surat Terbaru Saya
          </h2>
          <span className="text-xs px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-semibold">
            {recentSurat.length} surat
          </span>
        </div>

        {recentSurat.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-3">📭</div>
            <p className="text-gray-500 font-medium">Belum ada surat</p>
            <p className="text-gray-400 text-xs mt-1">Kirim surat pertama Anda dari menu Kirim Surat</p>
          </div>
        ) : (
          <div className="p-3 sm:p-4 space-y-3">
            {recentSurat.map((s, idx) => (
              <div
                key={s.id_surat}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-amber-200 hover:bg-amber-50/20 hover:shadow-md transition-all duration-200"
              >
                <div className="hidden sm:flex items-center justify-center w-11 h-11 bg-gradient-to-br from-[#7C2D12] to-[#8B3A1A] text-white rounded-xl text-sm font-bold shadow-md flex-shrink-0">
                  {idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start sm:items-center gap-2 flex-wrap mb-1.5">
                    <p className="font-mono text-xs text-[#7C2D12] font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
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
                      {new Date(s.tanggal_kirim).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}