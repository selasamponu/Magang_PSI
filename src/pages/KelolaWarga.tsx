import { useState, useEffect } from 'react';
import { WargaDB, LogDB } from '../store/db';
import { Warga, User } from '../types';
import Modal from '../components/Modal';

interface Props {
  currentUser: User;
}

export default function KelolaWarga({ currentUser }: Props) {
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nik: '', nama_lengkap: '', alamat: '', rt: '', rw: '', no_hp: '', password: '' });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const refresh = () => {
    let data = WargaDB.getAll();
    if (search) data = data.filter(w => w.nama_lengkap.toLowerCase().includes(search.toLowerCase()) || w.nik.includes(search));
    setWargaList(data);
  };

  useEffect(() => { refresh(); }, [search]);

  const openAdd = () => {
    setForm({ nik: '', nama_lengkap: '', alamat: '', rt: '', rw: '', no_hp: '', password: '' });
    setEditMode(false);
    setError('');
    setShowForm(true);
  };

  const openEdit = (w: Warga) => {
    setForm({ nik: w.nik, nama_lengkap: w.nama_lengkap, alamat: w.alamat, rt: w.rt, rw: w.rw, no_hp: w.no_hp, password: '' });
    setEditMode(true);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!editMode && form.nik.length !== 16) { setError('NIK harus 16 digit!'); return; }
    if (!editMode && (!form.password || form.password.length < 6)) { setError('Password minimal 6 karakter!'); return; }

    if (editMode) {
      const updateData: Partial<Warga> = { nama_lengkap: form.nama_lengkap, alamat: form.alamat, rt: form.rt, rw: form.rw, no_hp: form.no_hp };
      if (form.password) updateData.password = form.password;
      WargaDB.update(form.nik, updateData);
      LogDB.create({ user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user', aktivitas: 'UPDATE_WARGA', detail: `Update warga ${form.nik}` });
    } else {
      if (WargaDB.getByNik(form.nik)) { setError('NIK sudah terdaftar!'); return; }
      WargaDB.create({ ...form, status: 'aktif', tanggal_daftar: new Date().toISOString(), terakhir_login: null });
      LogDB.create({ user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user', aktivitas: 'TAMBAH_WARGA', detail: `Tambah warga ${form.nik} - ${form.nama_lengkap}` });
    }
    setShowForm(false);
    refresh();
  };

  const toggleStatus = (w: Warga) => {
    const newStatus = w.status === 'aktif' ? 'nonaktif' : 'aktif';
    WargaDB.updateStatus(w.nik, newStatus);
    LogDB.create({ user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user', aktivitas: 'UPDATE_WARGA', detail: `Status ${w.nik} diubah ke ${newStatus}` });
    refresh();
  };

  const handleDelete = (w: Warga) => {
    if (confirm(`Hapus warga ${w.nama_lengkap}?`)) {
      WargaDB.delete(w.nik);
      LogDB.create({ user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user', aktivitas: 'HAPUS_WARGA', detail: `Hapus warga ${w.nik} - ${w.nama_lengkap}` });
      refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">👥 Kelola Warga</h1>
        <button onClick={openAdd} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600">+ Tambah Warga</button>
      </div>

      <input type="text" placeholder="Cari nama atau NIK..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-64 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">NIK</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">RT/RW</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">No HP</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {wargaList.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Belum ada warga terdaftar</td></tr>
              ) : wargaList.map((w) => (
                <tr key={w.nik} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{w.nik}</td>
                  <td className="px-4 py-3">{w.nama_lengkap}</td>
                  <td className="px-4 py-3">{w.rt}/{w.rw}</td>
                  <td className="px-4 py-3">{w.no_hp}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${w.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {w.status === 'aktif' ? '✅ Aktif' : '⛔ Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => toggleStatus(w)} className={`p-1.5 rounded-lg text-xs ${w.status === 'aktif' ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`} title={w.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}>
                        {w.status === 'aktif' ? '⏸️' : '▶️'}
                      </button>
                      <button onClick={() => openEdit(w)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Edit">✏️</button>
                      <button onClick={() => handleDelete(w)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Hapus">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editMode ? 'Edit Warga' : 'Tambah Warga'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIK (16 digit)</label>
            <input type="text" value={form.nik} onChange={e => setForm({...form, nik: e.target.value})} maxLength={16} disabled={editMode} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-100" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input type="text" value={form.nama_lengkap} onChange={e => setForm({...form, nama_lengkap: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea value={form.alamat} onChange={e => setForm({...form, alamat: e.target.value})} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RT</label>
              <input type="text" value={form.rt} onChange={e => setForm({...form, rt: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RW</label>
              <input type="text" value={form.rw} onChange={e => setForm({...form, rw: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No HP</label>
            <input type="tel" value={form.no_hp} onChange={e => setForm({...form, no_hp: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password {editMode && '(kosongkan jika tidak diubah)'}</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder={editMode ? '••••••' : 'Min 6 karakter'} required={!editMode} />
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
