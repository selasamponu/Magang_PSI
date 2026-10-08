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
      LOGIN: 'bg-blue-100 text-blue-700 border border-blue-200',
      LOGOUT: 'bg-gray-100 text-gray-700 border border-gray-200',
      KIRIM_SURAT: 'bg-purple-100 text-purple-700 border border-purple-200',
      VERIFIKASI_SURAT: 'bg-green-100 text-green-700 border border-green-200',
      TAMBAH_WARGA: 'bg-teal-100 text-teal-700 border border-teal-200',
      UPDATE_WARGA: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      HAPUS_WARGA: 'bg-red-100 text-red-700 border border-red-200',
      TAMBAH_USER: 'bg-teal-100 text-teal-700 border border-teal-200',
      UPDATE_USER: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      HAPUS_USER: 'bg-red-100 text-red-700 border border-red-200',
      BUAT_SURAT_KELUAR: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
      REGISTER: 'bg-pink-100 text-pink-700 border border-pink-200',
    };
    return map[aktivitas] || 'bg-gray-100 text-gray-700 border border-gray-200';
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

  const stats = {
    total: logs.length,
    login: logs.filter(l => l.aktivitas === 'LOGIN').length,
    kirimSurat: logs.filter(l => l.aktivitas === 'KIRIM_SURAT').length,
    verifikasi: logs.filter(l => l.aktivitas === 'VERIFIKASI_SURAT').length,
  };

  return (
    <div className="space-y-4 sm:space-y-5">
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

      {/* KPI CARDS — KECIL & RAPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white rounded-xl p-3 border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm shadow-sm flex-shrink-0">
              📋
            </div>
            <p className="text-[11px] font-medium text-gray-600 leading-tight">Total Log</p>
          </div>
          <p className="text-2xl font-bold text-gray-800 leading-none">{stats.total}</p>
        </div>

        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">
              🔑
            </div>
            <p className="text-[11px] font-medium text-blue-700 leading-tight">Login</p>
          </div>
          <p className="text-2xl font-bold text-blue-700 leading-none">{stats.login}</p>
        </div>

        <div className="bg-purple-50 rounded-xl p-3 border border-purple-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">
              📨
            </div>
            <p className="text-[11px] font-medium text-purple-700 leading-tight">Kirim Surat</p>
          </div>
          <p className="text-2xl font-bold text-purple-700 leading-none">{stats.kirimSurat}</p>
        </div>

        <div className="bg-green-50 rounded-xl p-3 border border-green-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">
              ✅
            </div>
            <p className="text-[11px] font-medium text-green-700 leading-tight">Verifikasi</p>
          </div>
          <p className="text-2xl font-bold text-green-700 leading-none">{stats.verifikasi}</p>
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
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
      </div>

      {/* DAFTAR LOG — CARD */}
      {logs.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
          <div className="text-6xl mb-3">📋</div>
          <p className="text-gray-400 font-medium">Belum ada log aktivitas</p>
          <p className="text-gray-300 text-xs mt-1">Aktivitas user akan tercatat di sini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((l, idx) => (
            <div
              key={l.id_log}
              className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50/20 hover:shadow-lg transition-all duration-200"
            >
              <div className="hidden sm:flex items-center justify-center w-11 h-11 bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl text-sm font-bold shadow-md flex-shrink-0">
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">{aktivitasIcon(l.aktivitas)}</span>
                  <p className="font-semibold text-gray-800 truncate">{l.nama_user}</p>
                </div>
                <p className={`inline-block font-mono text-xs px-2 py-0.5 rounded-md ${
                  l.user_type === 'user' ? 'bg-indigo-50 text-indigo-700' : 'bg-green-50 text-green-700'
                }`}>
                  {l.user_type === 'user' ? '👨‍💼 User' : '👤 Warga'}
                </p>
              </div>

              <div className="flex-1 min-w-0 sm:border-l sm:border-gray-100 sm:pl-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Aktivitas</p>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${aktivitasBadge(l.aktivitas)}`}>
                  <span>{aktivitasIcon(l.aktivitas)}</span>
                  <span>{l.aktivitas}</span>
                </span>
              </div>

              <div className="flex-1 min-w-0 sm:border-l sm:border-gray-100 sm:pl-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Detail</p>
                <p className="text-sm text-gray-700 line-clamp-2">{l.detail}</p>
              </div>

              <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4 sm:min-w-[130px]">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Waktu</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>🕐</span>
                  <span className="whitespace-nowrap">
                    {new Date(l.tanggal_waktu).toLocaleString('id-ID', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}