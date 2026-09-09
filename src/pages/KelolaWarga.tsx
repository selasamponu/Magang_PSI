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
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(w => w.nama_lengkap.toLowerCase().includes(q) || w.nik.includes(q) || w.alamat.toLowerCase().includes(q));
    }
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
      LogDB.create({ user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user', aktivitas: 'HAPUS_WARGA', detail: `Hapus warga ${w.nik}` });
      refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">👥 Kelola Warga</h1>
          <p className="text-sm text-gray-500">{wargaList.length} warga terdaftar</p>
        </div>
        <button onClick={openAdd} className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tambah Warga
        </button>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" placeholder="Cari nama, NIK, atau alamat..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">NIK</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Nama</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">RT/RW</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">No HP</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {wargaList.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">👥</div>
                  <p>Belum ada warga terdaftar</p>
                </td></tr>
              ) : wargaList.map((w) => (
                <tr key={w.nik} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{w.nik}</td>
                  <td className="px-4 py-3 font-medium">{w.nama_lengkap}</td>
                  <td className="px-4 py-3">{w.rt}/{w.rw}</td>
                  <td className="px-4 py-3">{w.no_hp}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${w.status === 'aktif' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                      {w.status === 'aktif' ? '✅ Aktif' : '⛔ Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => toggleStatus(w)} className={`p-2 rounded-lg transition-colors ${w.status === 'aktif' ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`} title={w.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}>
                        {w.status === 'aktif' ? '⏸️' : '▶️'}
                      </button>
                      <button onClick={() => openEdit(w)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Edit">✏️</button>
                      <button onClick={() => handleDelete(w)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Hapus">🗑️</button>
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
        {wargaList.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-400">Belum ada warga terdaftar</p>
          </div>
        ) : wargaList.map((w) => (
          <div key={w.nik} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{w.nama_lengkap}</p>
                <p className="text-xs text-gray-400 font-mono">{w.nik}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${w.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {w.status === 'aktif' ? '✅ Aktif' : '⛔ Nonaktif'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div><span className="text-gray-400">RT/RW:</span> {w.rt}/{w.rw}</div>
              <div><span className="text-gray-400">HP:</span> {w.no_hp}</div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => toggleStatus(w)} className={`flex-1 py-2 rounded-lg text-xs font-medium ${w.status === 'aktif' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                {w.status === 'aktif' ? '⏸️ Nonaktifkan' : '▶️ Aktifkan'}
              </button>
              <button onClick={() => openEdit(w)} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">✏️ Edit</button>
              <button onClick={() => handleDelete(w)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium">🗑️ Hapus</button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editMode ? 'Edit Warga' : 'Tambah Warga'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIK (16 digit)</label>
            <input type="text" value={form.nik} onChange={e => setForm({...form, nik: e.target.value})} maxLength={16} disabled={editMode} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-100" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input type="text" value={form.nama_lengkap} onChange={e => setForm({...form, nama_lengkap: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea value={form.alamat} onChange={e => setForm({...form, alamat: e.target.value})} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RT</label>
              <input type="text" value={form.rt} onChange={e => setForm({...form, rt: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RW</label>
              <input type="text" value={form.rw} onChange={e => setForm({...form, rw: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No HP</label>
            <input type="tel" value={form.no_hp} onChange={e => setForm({...form, no_hp: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password {editMode && '(kosongkan jika tidak diubah)'}</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder={editMode ? '••••••' : 'Min 6 karakter'} required={!editMode} />
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Batal</button>
            <button type="submit" className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm hover:opacity-90 font-medium shadow-sm">{editMode ? 'Update' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
