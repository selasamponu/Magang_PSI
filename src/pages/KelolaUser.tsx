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

  const refresh = () => {
    setUserList(UserDB.getAll());
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (editMode) {
      const updateData: Partial<User> = { nama: form.nama, username: form.username, role: form.role };
      if (form.password) updateData.password = form.password;
      UserDB.update(editId, updateData);
      LogDB.create({ user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user', aktivitas: 'UPDATE_USER', detail: `Update user ${form.username}` });
    } else {
      if (!form.password || form.password.length < 6) { setError('Password minimal 6 karakter!'); return; }
      if (UserDB.getByUsername(form.username)) { setError('Username sudah digunakan!'); return; }
      UserDB.create({ nama: form.nama, username: form.username, password: form.password, role: form.role, status: 'aktif' });
      LogDB.create({ user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user', aktivitas: 'TAMBAH_USER', detail: `Tambah user ${form.username}` });
    }
    setShowForm(false);
    refresh();
  };

  const handleDelete = (u: User) => {
    if (u.id === currentUser.id) { alert('Tidak bisa menghapus akun sendiri!'); return; }
    if (confirm(`Hapus user ${u.nama}?`)) {
      UserDB.delete(u.id);
      LogDB.create({ user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user', aktivitas: 'HAPUS_USER', detail: `Hapus user ${u.username}` });
      refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">👨‍💼 Kelola User</h1>
          <p className="text-sm text-gray-500">{userList.length} user terdaftar</p>
        </div>
        <button onClick={openAdd} className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tambah User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Username</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {userList.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{u.id}</td>
                  <td className="px-4 py-3">{u.nama}</td>
                  <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.status === 'aktif' ? '✅ Aktif' : '⛔ Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Edit">✏️</button>
                      <button onClick={() => handleDelete(u)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Hapus">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editMode ? 'Edit User' : 'Tambah User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
            <input type="text" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password {editMode && '(kosongkan jika tidak diubah)'}</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder={editMode ? '••••••' : 'Min 6 karakter'} required={!editMode} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value as 'admin' | 'operator'})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="admin">Admin</option>
              <option value="operator">Operator</option>
            </select>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Batal</button>
            <button type="submit" className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600">{editMode ? 'Update' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
