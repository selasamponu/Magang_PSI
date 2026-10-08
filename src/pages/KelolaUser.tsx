import { useState, useEffect } from 'react';
import { UserDB, LogDB } from '../store/db';
import { User } from '../types';
import Modal from '../components/Modal';

interface Props {
  currentUser: User;
}

export default function KelolaUser({ currentUser }: Props) {
  const [userList, setUserList] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nama: '', username: '', password: '', role: 'operator' as 'admin' | 'operator' });
  const [editId, setEditId] = useState<number>(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await UserDB.getAll();
      setUserList(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const openAdd = () => {
    setForm({ nama: '', username: '', password: '', role: 'operator' });
    setEditMode(false); setError(''); setShowForm(true);
  };

  const openEdit = (u: User) => {
    setForm({ nama: u.nama, username: u.username, password: '', role: u.role });
    setEditId(u.id); setEditMode(true); setError(''); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      if (editMode) {
        const updateData: any = { nama: form.nama, username: form.username, role: form.role };
        if (form.password) updateData.password = form.password;
        await UserDB.update(editId, updateData);
        await LogDB.create({ user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user', aktivitas: 'UPDATE_USER', detail: `Update user ${form.username}` });
      } else {
        if (!form.password || form.password.length < 6) { setError('Password minimal 6 karakter!'); return; }
        await UserDB.create({ nama: form.nama, username: form.username, password: form.password, role: form.role, status: 'aktif' } as any);
        await LogDB.create({ user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user', aktivitas: 'TAMBAH_USER', detail: `Tambah user ${form.username}` });
      }
      setShowForm(false); await refresh();
    } catch (err: any) { setError(err.message || 'Gagal menyimpan user'); }
  };

  const handleDelete = async (u: User) => {
    if (u.id === currentUser.id) { alert('Tidak bisa menghapus akun sendiri!'); return; }
    if (confirm(`Hapus user ${u.nama}?`)) {
      try {
        await UserDB.delete(u.id);
        await LogDB.create({ user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user', aktivitas: 'HAPUS_USER', detail: `Hapus user ${u.username}` });
        await refresh();
      } catch (err) { alert('Gagal menghapus user'); }
    }
  };

  const stats = {
    total: userList.length,
    admin: userList.filter(u => u.role === 'admin').length,
    operator: userList.filter(u => u.role === 'operator').length,
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">👨‍💼 Kelola User</h1>
          <p className="text-sm text-gray-500 mt-1">{userList.length} user terdaftar</p>
        </div>
        <button onClick={openAdd} className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 hover-scale">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah User
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-white rounded-xl p-3 border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm shadow-sm flex-shrink-0">👨‍💼</div>
            <p className="text-[11px] font-medium text-gray-600 leading-tight">Total User</p>
          </div>
          <p className="text-2xl font-bold text-gray-800 leading-none">{stats.total}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">👑</div>
            <p className="text-[11px] font-medium text-red-700 leading-tight">Admin</p>
          </div>
          <p className="text-2xl font-bold text-red-700 leading-none">{stats.admin}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">🧑‍💼</div>
            <p className="text-[11px] font-medium text-blue-700 leading-tight">Operator</p>
          </div>
          <p className="text-2xl font-bold text-blue-700 leading-none">{stats.operator}</p>
        </div>
      </div>

      {/* DAFTAR USER — CARD */}
      {userList.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
          <div className="text-6xl mb-3">👨‍💼</div>
          <p className="text-gray-400 font-medium">Belum ada user terdaftar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {userList.map((u, idx) => (
            <div
              key={u.id}
              className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50/20 hover:shadow-lg transition-all duration-200"
            >
              <div className={`hidden sm:flex items-center justify-center w-12 h-12 rounded-xl text-xl font-bold text-white shadow-md flex-shrink-0 ${
                u.role === 'admin'
                  ? 'bg-gradient-to-br from-red-500 to-rose-500'
                  : 'bg-gradient-to-br from-blue-500 to-cyan-500'
              }`}>
                {u.nama.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">{u.role === 'admin' ? '👑' : '🧑‍💼'}</span>
                  <p className="font-semibold text-gray-800 truncate">{u.nama}</p>
                </div>
                <p className="font-mono text-xs text-gray-500">@{u.username}</p>
              </div>

              <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4 sm:min-w-[80px]">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">ID User</p>
                <p className="font-mono text-sm font-bold text-purple-600">#{u.id}</p>
              </div>

              <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 sm:hidden">Role</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  u.role === 'admin'
                    ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200'
                    : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200'
                }`}>
                  {u.role === 'admin' ? '👑 Admin' : '👤 Operator'}
                </span>
              </div>

              <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 sm:hidden">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  u.status === 'aktif'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {u.status === 'aktif' ? '✅ Aktif' : '⛔ Nonaktif'}
                </span>
              </div>

              <div className="flex gap-1.5 flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
                <button onClick={() => openEdit(u)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Edit">
                  ✏️
                </button>
                <button onClick={() => handleDelete(u)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Hapus">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* FORM MODAL — DARK THEME                                       */}
      {/* ============================================================ */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editMode ? 'Edit User' : 'Tambah User'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">

          {/* Info Box Mode Edit */}
          {editMode && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-300">Mode Edit</p>
              <p className="text-xs text-amber-200/80 mt-1">
                Kosongkan password jika tidak ingin mengubahnya.
              </p>
            </div>
          )}

          {/* Section Data Akun — DARK CARD */}
          <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50 space-y-4">

            {/* Nama */}
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                Nama Lengkap <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.nama}
                onChange={e => setForm({ ...form, nama: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all"
                placeholder="Nama lengkap user"
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all font-mono"
                placeholder="username (tanpa spasi)"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Username dipakai untuk login, tidak boleh ada spasi</p>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                Role / Hak Akses <span className="text-red-400">*</span>
              </label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value as 'admin' | 'operator' })}
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all"
              >
                <option value="admin">Admin — Akses penuh ke semua fitur</option>
                <option value="operator">Operator — Akses terbatas (verifikasi surat)</option>
              </select>
            </div>
          </div>

          {/* Section Password — DARK CARD */}
          <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50 space-y-3">
            <div>
              <p className="text-sm font-semibold text-amber-400">Password Akun</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {editMode ? 'Kosongkan jika tidak ingin mengubah password' : 'Minimal 6 karakter'}
              </p>
            </div>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all"
              placeholder={editMode ? '•••••• (biarkan kosong jika tidak diubah)' : 'Minimal 6 karakter'}
              required={!editMode}
              autoComplete="new-password"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border-2 border-red-500/40 rounded-xl p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-3 border-t border-gray-700/50">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-gray-600 rounded-xl text-sm font-semibold text-gray-300 hover:bg-gray-700/30 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 shadow-lg shadow-purple-500/30 transition-all"
            >
              {editMode ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}