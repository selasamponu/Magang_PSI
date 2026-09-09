import { useState, useEffect } from 'react';
import { LogDB } from '../store/db';
import { LogAktivitas } from '../types';

export default function LogAktivitasPage() {
  const [logs, setLogs] = useState<LogAktivitas[]>([]);
  const [filter, setFilter] = useState('');

  const refresh = () => {
    let data = LogDB.getAll();
    if (filter) data = data.filter(l => l.aktivitas.toLowerCase().includes(filter.toLowerCase()) || l.nama_user.toLowerCase().includes(filter.toLowerCase()));
    setLogs(data.slice(0, 100));
  };

  useEffect(() => { refresh(); }, [filter]);

  const aktivitasBadge = (aktivitas: string) => {
    const map: Record<string, string> = {
      LOGIN: 'bg-blue-100 text-blue-700',
      LOGOUT: 'bg-gray-100 text-gray-700',
      KIRIM_SURAT: 'bg-purple-100 text-purple-700',
      VERIFIKASI_SURAT: 'bg-green-100 text-green-700',
      TAMBAH_WARGA: 'bg-teal-100 text-teal-700',
      UPDATE_WARGA: 'bg-yellow-100 text-yellow-700',
      HAPUS_WARGA: 'bg-red-100 text-red-700',
      TAMBAH_USER: 'bg-teal-100 text-teal-700',
      UPDATE_USER: 'bg-yellow-100 text-yellow-700',
      HAPUS_USER: 'bg-red-100 text-red-700',
      BUAT_SURAT_KELUAR: 'bg-indigo-100 text-indigo-700',
      REGISTER: 'bg-pink-100 text-pink-700',
    };
    return map[aktivitas] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">📋 Log Aktivitas</h1>
          <p className="text-sm text-gray-500">{logs.length} aktivitas tercatat</p>
        </div>
        <button onClick={refresh} className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      <input type="text" placeholder="Cari aktivitas atau user..." value={filter} onChange={e => setFilter(e.target.value)} className="w-full sm:w-64 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Tipe</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Aktivitas</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Detail</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">📋</div>
                  <p>Belum ada log aktivitas</p>
                </td></tr>
              ) : logs.map((l) => (
                <tr key={l.id_log} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs max-w-[120px] truncate">{l.id_log}</td>
                  <td className="px-4 py-3 font-medium">{l.nama_user}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${l.user_type === 'user' ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                      {l.user_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${aktivitasBadge(l.aktivitas)}`}>
                      {l.aktivitas}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-gray-600">{l.detail}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(l.tanggal_waktu).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {logs.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-gray-400">Belum ada log aktivitas</p>
          </div>
        ) : logs.map((l) => (
          <div key={l.id_log} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{l.nama_user}</p>
                <p className="text-xs text-gray-400 font-mono truncate">{l.id_log}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${aktivitasBadge(l.aktivitas)}`}>
                {l.aktivitas}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-xs ${l.user_type === 'user' ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                {l.user_type}
              </span>
              <span className="text-xs text-gray-400">{new Date(l.tanggal_waktu).toLocaleString('id-ID')}</span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{l.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
