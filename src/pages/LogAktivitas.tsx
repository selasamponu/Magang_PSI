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
        <h1 className="text-2xl font-bold text-gray-800">📋 Log Aktivitas</h1>
        <button onClick={refresh} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600">Refresh</button>
      </div>

      <input type="text" placeholder="Cari aktivitas atau user..." value={filter} onChange={e => setFilter(e.target.value)} className="w-full sm:w-64 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipe</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aktivitas</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Detail</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Belum ada log aktivitas</td></tr>
              ) : logs.map((l) => (
                <tr key={l.id_log} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs max-w-[120px] truncate">{l.id_log}</td>
                  <td className="px-4 py-3">{l.nama_user}</td>
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
    </div>
  );
}
