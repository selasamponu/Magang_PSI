import { useState, useEffect } from 'react';
import { getDashboardStats, SuratMasukDB } from '../store/db';
import { SuratMasuk } from '../types';

const defaultStats = {
  totalSuratMasuk: 0,
  menungguVerifikasi: 0,
  diverifikasi: 0,
  ditolak: 0,
  totalWarga: 0,
  totalUser: 0,
};

export default function DashboardAdmin() {
  const [stats, setStats] = useState<any>(defaultStats);
  const [recentSurat, setRecentSurat] = useState<SuratMasuk[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      const statsData = await getDashboardStats('user');
      setStats(statsData);

      const all = await SuratMasukDB.getAll();
      const sorted = all
        .sort((a: SuratMasuk, b: SuratMasuk) =>
          new Date(b.tanggal_kirim).getTime() - new Date(a.tanggal_kirim).getTime()
        )
        .slice(0, 8);
      setRecentSurat(sorted);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

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
    { icon: '📨', label: 'Total Surat Masuk', value: stats.totalSuratMasuk, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { icon: '⏳', label: 'Menunggu Verifikasi', value: stats.menungguVerifikasi, color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { icon: '✅', label: 'Diverifikasi', value: stats.diverifikasi, color: 'from-green-500 to-emerald-500', bg: 'bg-green-50', border: 'border-green-200' },
    { icon: '❌', label: 'Ditolak', value: stats.ditolak, color: 'from-red-500 to-rose-500', bg: 'bg-red-50', border: 'border-red-200' },
    { icon: '👥', label: 'Total Warga', value: stats.totalWarga, color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50', border: 'border-purple-200' },
    { icon: '👨‍💼', label: 'Total User', value: stats.totalUser, color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard Admin</h1>
          <p className="text-sm text-gray-500 mt-0.5">Selamat datang di Aplikasi Surat Kemantren Tegalrejo Yogyakarta</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* ============================================================ */}
      {/* KPI CARDS — KECIL & RAPI                                     */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`${card.bg} rounded-xl p-3 border ${card.border} hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
          >
            {/* Icon + Label sejajar */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-sm shadow-sm flex-shrink-0`}>
                {card.icon}
              </div>
              <p className="text-[11px] font-medium text-gray-600 leading-tight">{card.label}</p>
            </div>
            {/* Value */}
            <p className="text-2xl font-bold text-gray-800 leading-none">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* SURAT TERBARU — CARD PER BARIS                                */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50/40 to-orange-50/40">
          <h2 className="font-bold text-gray-800 flex items-center gap-2 text-base">
            <span className="text-lg">📨</span>
            Surat Terbaru
          </h2>
          <span className="text-xs px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-semibold">
            {recentSurat.length} surat
          </span>
        </div>

        {/* List */}
        {recentSurat.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-3">📭</div>
            <p className="text-gray-400 font-medium">Belum ada surat masuk</p>
            <p className="text-gray-300 text-xs mt-1">Surat akan muncul setelah warga mengirim</p>
          </div>
        ) : (
          <div className="p-3 sm:p-4 space-y-3">
            {recentSurat.map((s, idx) => (
              <div
                key={s.id_surat}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50/20 hover:shadow-md transition-all duration-200"
              >
                {/* Nomor urut */}
                <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl text-sm font-bold shadow-md flex-shrink-0">
                  {idx + 1}
                </div>

                {/* Info Utama */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start sm:items-center gap-2 flex-wrap mb-1.5">
                    <p className="font-mono text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-md">
                      {s.id_surat}
                    </p>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                      {s.kategori}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">👤</span>
                    <p className="font-semibold text-gray-800 truncate">{s.nama_pengirim}</p>
                  </div>
                  <p className="text-xs text-gray-400 font-mono truncate">{s.nik_pengirim}</p>
                </div>

                {/* Perihal */}
                <div className="flex-1 min-w-0 sm:border-l sm:border-gray-100 sm:pl-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Perihal</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{s.perihal}</p>
                </div>

                {/* Status */}
                <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 sm:hidden">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusBadge(s.status)}`}>
                    <span>{statusIcon(s.status)}</span>
                    <span className="capitalize">{s.status}</span>
                  </span>
                </div>

                {/* Tanggal */}
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