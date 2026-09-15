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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const openAdd = () => {
    setForm({ nama: '', username: '', password: '', role: 'operator' });
    setEditMode(false);
    setError('');
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setForm({ nama: u.nama, username: u.username, password: '', role: u.role });
    setEditId(u.id);
    setEditMode(true);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
      setShowForm(false);
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan user');
    }
  };

  const handleDelete = async (u: User) => {
    if (u.id === currentUser.id) { alert('Tidak bisa menghapus akun sendiri!'); return; }
    if (confirm(`Hapus user ${u.nama}?`)) {
      try {
        await UserDB.delete(u.id);
        await LogDB.create({ user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user', aktivitas: 'HAPUS_USER', detail: `Hapus user ${u.username}` });
        await refresh();
      } catch (err) {
        alert('Gagal menghapus user');
      }
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm card-hover">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total User</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{userList.length}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl p-4 border border-red-200 card-hover">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Admin</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{userList.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl p-4 border border-blue-200 card-hover">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Operator</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{userList.filter(u => u.role === 'operator').length}</p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden card-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
              <tr>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">ID</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Nama</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Username</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Status</th>
                <th className="text-center px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {userList.map((u) => (
                <tr key={u.id} className="hover:bg-purple-50/30 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-purple-600 font-semibold">#{u.id}</td>
                  <td className="px-5 py-4 font-semibold text-gray-800">{u.nama}</td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-600">{u.username}</td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      u.role === 'admin' 
                        ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200' 
                        : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200'
                    }`}>
                      {u.role === 'admin' ? '👑 Admin' : '👤 Operator'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      u.status === 'aktif' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {u.status === 'aktif' ? '✅ Aktif' : '⛔ Nonaktif'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5 justify-center">
                      <button onClick={() => openEdit(u)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Edit">✏️</button>
                      <button onClick={() => handleDelete(u)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Hapus">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {userList.map((u) => (
          <div key={u.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 space-y-3 card-hover">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg ${
                  u.role === 'admin' ? 'bg-gradient-to-br from-red-500 to-rose-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                }`}>
                  {u.nama.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{u.nama}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">@{u.username}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {u.role === 'admin' ? '👑 Admin' : '👤 Operator'}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                u.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {u.status === 'aktif' ? '✅ Aktif' : '⛔ Nonaktif'}
              </span>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => openEdit(u)} className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold">✏️ Edit</button>
              <button onClick={() => handleDelete(u)} className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">🗑️ Hapus</button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editMode ? 'Edit User' : 'Tambah User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nama</label>
            <input type="text" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
            <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password {editMode && <span className="text-xs text-gray-400">(kosongkan jika tidak diubah)</span>}
            </label>
            <input 
              type="password" 
              value={form.password} 
              onChange={e => setForm({...form, password: e.target.value})} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" 
              placeholder={editMode ? '••••••' : 'Min 6 karakter'} 
              required={!editMode} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value as 'admin' | 'operator'})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
              <option value="admin">👑 Admin</option>
              <option value="operator">👤 Operator</option>
            </select>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm flex items-center gap-2">⚠️ {error}</div>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Batal</button>
            <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 shadow-lg shadow-purple-500/30">
              {editMode ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}