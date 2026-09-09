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
      terkirim: 'bg-blue-100 text-blue-700',
      dibaca: 'bg-blue-100 text-blue-700',
      diverifikasi: 'bg-green-100 text-green-700',
      ditolak: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const cards = [
    { icon: '📨', label: 'Total Surat Masuk', value: stats.totalSuratMasuk, color: 'from-blue-500 to-blue-600' },
    { icon: '⏳', label: 'Menunggu Verifikasi', value: stats.menungguVerifikasi, color: 'from-yellow-500 to-orange-500' },
    { icon: '✅', label: 'Diverifikasi', value: stats.diverifikasi, color: 'from-green-500 to-emerald-500' },
    { icon: '❌', label: 'Ditolak', value: stats.ditolak, color: 'from-red-500 to-rose-500' },
    { icon: '👥', label: 'Total Warga', value: stats.totalWarga, color: 'from-purple-500 to-violet-500' },
    { icon: '👨‍💼', label: 'Total User', value: stats.totalUser, color: 'from-indigo-500 to-blue-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin</h1>
          <p className="text-gray-500 text-sm">Selamat datang di Aplikasi Surat Kemantren Tegalrejo</p>
        </div>
        <button onClick={refresh} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl shadow-lg`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Surat */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">📨 Surat Terbaru</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pengirim</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Kategori</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Perihal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSurat.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Belum ada surat masuk</td></tr>
              ) : recentSurat.map((s) => (
                <tr key={s.id_surat} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{s.id_surat}</td>
                  <td className="px-4 py-3">{s.nama_pengirim}</td>
                  <td className="px-4 py-3">{s.kategori}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate">{s.perihal}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(s.status)}`}>{s.status}</span></td>
                  <td className="px-4 py-3 text-gray-500">{new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
