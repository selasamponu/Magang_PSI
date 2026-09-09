import { useState, useEffect } from 'react';
import { getDashboardStats, SuratMasukDB } from '../store/db';
import { SuratMasuk } from '../types';

export default function DashboardAdmin() {
  const [stats, setStats] = useState(getDashboardStats('user'));
  const [recentSurat, setRecentSurat] = useState<SuratMasuk[]>([]);

  const refresh = () => {
    setStats(getDashboardStats('user'));
    const all = SuratMasukDB.getAll();
    setRecentSurat(all.sort((a, b) => new Date(b.tanggal_kirim).getTime() - new Date(a.tanggal_kirim).getTime()).slice(0, 8));
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
    { icon: '📨', label: 'Total Surat Masuk', value: stats.totalSuratMasuk, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
    { icon: '⏳', label: 'Menunggu Verifikasi', value: stats.menungguVerifikasi, color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-50' },
    { icon: '✅', label: 'Diverifikasi', value: stats.diverifikasi, color: 'from-green-500 to-emerald-500', bg: 'bg-green-50' },
    { icon: '❌', label: 'Ditolak', value: stats.ditolak, color: 'from-red-500 to-rose-500', bg: 'bg-red-50' },
    { icon: '👥', label: 'Total Warga', value: stats.totalWarga, color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50' },
    { icon: '👨‍💼', label: 'Total User', value: stats.totalUser, color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard Admin</h1>
          <p className="text-sm text-gray-500">Selamat datang di Aplikasi Surat Kemantren Tegalrejo</p>
        </div>
        <button onClick={refresh} className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      {/* KPI Cards - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {cards.map((card, i) => (
          <div key={i} className={`${card.bg} rounded-xl p-3 sm:p-4 border border-gray-100/50 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
            <div className="flex flex-col items-start">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-lg sm:text-2xl shadow-lg mb-2 sm:mb-3`}>
                {card.icon}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">{card.label}</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Surat - Desktop Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="text-lg">📨</span> Surat Terbaru
          </h2>
          <span className="text-xs text-gray-400">{recentSurat.length} surat</span>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Pengirim</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Kategori</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Perihal</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSurat.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">📭</div>
                  <p>Belum ada surat masuk</p>
                </td></tr>
              ) : recentSurat.map((s) => (
                <tr key={s.id_surat} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">{s.id_surat}</td>
                  <td className="px-4 py-3 font-medium">{s.nama_pengirim}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{s.kategori}</span></td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-gray-700">{s.perihal}</td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge(s.status)}`}>{s.status}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(s.tanggal_kirim).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {recentSurat.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <p>Belum ada surat masuk</p>
            </div>
          ) : recentSurat.map((s) => (
            <div key={s.id_surat} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-indigo-600">{s.id_surat}</p>
                  <p className="font-medium text-gray-800 truncate">{s.nama_pengirim}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ml-2 ${statusBadge(s.status)}`}>{s.status}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{s.kategori}</span>
                <span className="text-xs text-gray-400">{new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-1">{s.perihal}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
