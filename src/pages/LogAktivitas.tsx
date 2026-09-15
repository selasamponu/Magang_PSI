import { useState, useEffect } from 'react';
import { LogDB } from '../store/db';
import { LogAktivitas } from '../types';

export default function LogAktivitasPage() {
  const [logs, setLogs] = useState<LogAktivitas[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      let data = await LogDB.getAll();
      if (filter) {
        data = data.filter((l: LogAktivitas) => 
          l.aktivitas.toLowerCase().includes(filter.toLowerCase()) || 
          l.nama_user.toLowerCase().includes(filter.toLowerCase())
        );
      }
      setLogs(data.slice(0, 100));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [filter]);

  const aktivitasBadge = (aktivitas: string) => {
    const map: Record<string, string> = {
      LOGIN: 'bg-blue-100 text-blue-700 border-blue-200',
      LOGOUT: 'bg-gray-100 text-gray-700 border-gray-200',
      KIRIM_SURAT: 'bg-purple-100 text-purple-700 border-purple-200',
      VERIFIKASI_SURAT: 'bg-green-100 text-green-700 border-green-200',
      TAMBAH_WARGA: 'bg-teal-100 text-teal-700 border-teal-200',
      UPDATE_WARGA: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      HAPUS_WARGA: 'bg-red-100 text-red-700 border-red-200',
      TAMBAH_USER: 'bg-teal-100 text-teal-700 border-teal-200',
      UPDATE_USER: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      HAPUS_USER: 'bg-red-100 text-red-700 border-red-200',
      BUAT_SURAT_KELUAR: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      REGISTER: 'bg-pink-100 text-pink-700 border-pink-200',
    };
    return map[aktivitas] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const aktivitasIcon = (aktivitas: string) => {
    const map: Record<string, string> = {
      LOGIN: '🔑',
      LOGOUT: '🚪',
      KIRIM_SURAT: '📨',
      VERIFIKASI_SURAT: '✅',
      TAMBAH_WARGA: '➕',
      UPDATE_WARGA: '✏️',
      HAPUS_WARGA: '🗑️',
      TAMBAH_USER: '➕',
      UPDATE_USER: '✏️',
      HAPUS_USER: '🗑️',
      BUAT_SURAT_KELUAR: '📤',
      REGISTER: '📝',
    };
    return map[aktivitas] || '📋';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">📋 Log Aktivitas</h1>
          <p className="text-sm text-gray-500 mt-1">{logs.length} aktivitas tercatat</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm card-hover">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-gray-800">{logs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200 card-hover">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔑</span>
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Login</p>
              <p className="text-2xl font-bold text-blue-700">{logs.filter(l => l.aktivitas === 'LOGIN').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200 card-hover">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📨</span>
            <div>
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Kirim Surat</p>
              <p className="text-2xl font-bold text-purple-700">{logs.filter(l => l.aktivitas === 'KIRIM_SURAT').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200 card-hover">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Verifikasi</p>
              <p className="text-2xl font-bold text-green-700">{logs.filter(l => l.aktivitas === 'VERIFIKASI_SURAT').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari aktivitas atau nama user..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden card-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
              <tr>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">ID Log</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Tipe</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Aktivitas</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Detail</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16">
                  <div className="text-6xl mb-3">📋</div>
                  <p className="text-gray-400 font-medium">Belum ada log aktivitas</p>
                  <p className="text-gray-300 text-xs mt-1">Aktivitas user akan tercatat di sini</p>
                </td></tr>
              ) : logs.map((l) => (
                <tr key={l.id_log} className="hover:bg-purple-50/30 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-gray-500 max-w-[140px] truncate">{l.id_log}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-800">{l.nama_user}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      l.user_type === 'user' 
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {l.user_type === 'user' ? '👨‍💼 User' : '👤 Warga'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${aktivitasBadge(l.aktivitas)}`}>
                      <span>{aktivitasIcon(l.aktivitas)}</span>
                      {l.aktivitas}
                    </span>
                  </td>
                  <td className="px-5 py-4 max-w-[240px] truncate text-gray-600 text-xs">{l.detail}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(l.tanggal_waktu).toLocaleString('id-ID', { 
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {logs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-gray-400 font-medium">Belum ada log aktivitas</p>
          </div>
        ) : logs.map((l) => (
          <div key={l.id_log} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 space-y-3 card-hover">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  l.user_type === 'user' ? 'bg-indigo-100' : 'bg-green-100'
                }`}>
                  {aktivitasIcon(l.aktivitas)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{l.nama_user}</p>
                  <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{l.id_log}</p>
                </div>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${aktivitasBadge(l.aktivitas)}`}>
              <span>{aktivitasIcon(l.aktivitas)}</span>
              {l.aktivitas}
            </span>
            <p className="text-sm text-gray-600 line-clamp-2">{l.detail}</p>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                l.user_type === 'user' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {l.user_type === 'user' ? '👨‍💼 User' : '👤 Warga'}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(l.tanggal_waktu).toLocaleString('id-ID', { 
                  day: '2-digit', month: 'short',
                  hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}