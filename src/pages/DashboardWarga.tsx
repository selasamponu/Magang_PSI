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
      terkirim: 'bg-blue-100 text-blue-700 border-blue-200',
      dibaca: 'bg-sky-100 text-sky-700 border-sky-200',
      diverifikasi: 'bg-green-100 text-green-700 border-green-200',
      ditolak: 'bg-red-100 text-red-700 border-red-200',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const cards = [
    { icon: '📨', label: 'Surat Saya', value: stats.totalSurat, color: 'from-blue-500 to-blue-600', bg: 'from-blue-50 to-blue-100', border: 'border-blue-200' },
    { icon: '⏳', label: 'Diproses', value: stats.menunggu, color: 'from-amber-500 to-orange-500', bg: 'from-amber-50 to-orange-100', border: 'border-amber-200' },
    { icon: '✅', label: 'Diverifikasi', value: stats.diverifikasi, color: 'from-green-500 to-emerald-500', bg: 'from-green-50 to-emerald-100', border: 'border-green-200' },
    { icon: '❌', label: 'Ditolak', value: stats.ditolak, color: 'from-red-500 to-rose-500', bg: 'from-red-50 to-rose-100', border: 'border-red-200' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section - COKLAT DENGAN TEKS PUTIH */}
      <div className="bg-gradient-to-br from-[#7C2D12] via-[#8B3A1A] to-[#7C2D12] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-10 -bottom-10 w-52 h-52 bg-white/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg animate-float">
              👋
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-md">Halo, {warga.nama_lengkap}!</h1>
              <p className="text-white/90 text-sm mt-0.5">Selamat datang di Aplikasi Surat</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>
              NIK: {warga.nik}
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`bg-gradient-to-br ${card.bg} rounded-2xl p-5 border ${card.border} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group animate-fade-in-up`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${card.color} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
            <div className="relative z-10">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl shadow-lg mb-3 group-hover:scale-110 transition-transform duration-300`}>
                {card.icon}
              </div>
              <p className="text-sm font-semibold text-gray-700">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Surat */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden card-hover">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-orange-50/50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
            <span className="text-xl">📜</span> Surat Terbaru Saya
          </h2>
          <span className="text-xs px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-semibold">
            {recentSurat.length} surat
          </span>
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">ID</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Kategori</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Perihal</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSurat.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16">
                  <div className="text-6xl mb-3">📭</div>
                  <p className="text-gray-500 font-medium">Belum ada surat</p>
                  <p className="text-gray-400 text-xs mt-1">Kirim surat pertama Anda dari menu Kirim Surat</p>
                </td></tr>
              ) : recentSurat.map((s) => (
                <tr key={s.id_surat} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-[#7C2D12] font-semibold">{s.id_surat}</td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-medium">{s.kategori}</span>
                  </td>
                  <td className="px-5 py-4 max-w-[200px] truncate text-gray-900">{s.perihal}</td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-xs">
                    {new Date(s.tanggal_kirim).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="sm:hidden divide-y divide-gray-100">
          {recentSurat.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-500 font-medium">Belum ada surat</p>
            </div>
          ) : recentSurat.map((s) => (
            <div key={s.id_surat} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-[#7C2D12] font-semibold">{s.id_surat}</p>
                  <p className="text-sm text-gray-900 truncate mt-1">{s.perihal}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ml-2 ${statusBadge(s.status)}`}>
                  {s.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{s.kategori}</span>
                <span className="text-xs text-gray-500">
                  {new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}