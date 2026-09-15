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
  const [form, setForm] = useState({
    nik: '',
    nama_lengkap: '',
    alamat: '',
    rt: '',
    rw: '',
    no_hp: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      let data = await WargaDB.getAll();
      if (search) {
        const q = search.toLowerCase();
        data = data.filter(
          (w: Warga) =>
            w.nama_lengkap.toLowerCase().includes(q) ||
            w.nik.includes(q) ||
            w.alamat.toLowerCase().includes(q)
        );
      }
      setWargaList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [search]);

  const openAdd = () => {
    setForm({
      nik: '',
      nama_lengkap: '',
      alamat: '',
      rt: '',
      rw: '',
      no_hp: '',
      password: '',
    });
    setEditMode(false);
    setError('');
    setShowForm(true);
  };

  const openEdit = (w: Warga) => {
    setForm({
      nik: w.nik,
      nama_lengkap: w.nama_lengkap,
      alamat: w.alamat,
      rt: w.rt,
      rw: w.rw,
      no_hp: w.no_hp,
      password: '',
    });
    setEditMode(true);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!editMode && form.nik.length !== 16) {
      setError('NIK harus 16 digit!');
      return;
    }
    if (!editMode && (!form.password || form.password.length < 6)) {
      setError('Password minimal 6 karakter!');
      return;
    }

    try {
      if (editMode) {
        const updateData: any = {
          nama_lengkap: form.nama_lengkap,
          alamat: form.alamat,
          rt: form.rt,
          rw: form.rw,
          no_hp: form.no_hp,
        };
        if (form.password) updateData.password = form.password;
        await WargaDB.update(form.nik, updateData);
        await LogDB.create({
          user_id: currentUser.username,
          nama_user: currentUser.nama,
          user_type: 'user',
          aktivitas: 'UPDATE_WARGA',
          detail: `Update warga ${form.nik}`,
        });
      } else {
        const existing = await WargaDB.getByNik(form.nik);
        if (existing) {
          setError('NIK sudah terdaftar!');
          return;
        }
        await WargaDB.create({
          ...form,
          status: 'aktif',
          tanggal_daftar: new Date().toISOString(),
          terakhir_login: null,
        });
        await LogDB.create({
          user_id: currentUser.username,
          nama_user: currentUser.nama,
          user_type: 'user',
          aktivitas: 'TAMBAH_WARGA',
          detail: `Tambah warga ${form.nik} - ${form.nama_lengkap}`,
        });
      }
      setShowForm(false);
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data');
    }
  };

  const toggleStatus = async (w: Warga) => {
    try {
      const newStatus = w.status === 'aktif' ? 'nonaktif' : 'aktif';
      await WargaDB.updateStatus(w.nik, newStatus);
      await LogDB.create({
        user_id: currentUser.username,
        nama_user: currentUser.nama,
        user_type: 'user',
        aktivitas: 'UPDATE_WARGA',
        detail: `Status ${w.nik} diubah ke ${newStatus}`,
      });
      await refresh();
    } catch (err) {
      alert('Gagal update status');
    }
  };

  const handleDelete = async (w: Warga) => {
    if (confirm(`Hapus warga ${w.nama_lengkap}?`)) {
      try {
        await WargaDB.delete(w.nik);
        await LogDB.create({
          user_id: currentUser.username,
          nama_user: currentUser.nama,
          user_type: 'user',
          aktivitas: 'HAPUS_WARGA',
          detail: `Hapus warga ${w.nik}`,
        });
        await refresh();
      } catch (err) {
        alert('Gagal menghapus warga');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">👥 Kelola Warga</h1>
          <p className="text-sm text-gray-500 mt-1">{wargaList.length} warga terdaftar</p>
        </div>
        <button
          onClick={openAdd}
          className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 hover-scale"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Warga
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm card-hover">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Warga</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{wargaList.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 border border-green-200 card-hover">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Aktif</p>
          <p className="text-3xl font-bold text-green-700 mt-1">
            {wargaList.filter((w) => w.status === 'aktif').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl p-4 border border-red-200 card-hover">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Nonaktif</p>
          <p className="text-3xl font-bold text-red-700 mt-1">
            {wargaList.filter((w) => w.status === 'nonaktif').length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            name="search_warga_kemantren"
            autoComplete="off"
            placeholder="Cari nama, NIK, atau alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden card-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
              <tr>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">NIK</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Nama</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">RT/RW</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">No HP</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Status</th>
                <th className="text-center px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {wargaList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="text-6xl mb-3">👥</div>
                    <p className="text-gray-400 font-medium">Belum ada warga terdaftar</p>
                    <p className="text-gray-300 text-xs mt-1">Klik &quot;Tambah Warga&quot; untuk menambahkan</p>
                  </td>
                </tr>
              ) : (
                wargaList.map((w) => (
                  <tr key={w.nik} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-purple-600 font-semibold">{w.nik}</td>
                    <td className="px-5 py-4 font-semibold text-gray-800">{w.nama_lengkap}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {w.rt}/{w.rw}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{w.no_hp}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          w.status === 'aktif'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}
                      >
                        {w.status === 'aktif' ? '✅ Aktif' : '⛔ Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5 justify-center">
                        <button
                          onClick={() => toggleStatus(w)}
                          className={`p-2 rounded-lg transition-colors ${
                            w.status === 'aktif'
                              ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                          title={w.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {w.status === 'aktif' ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => openEdit(w)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(w)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {wargaList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-gray-400 font-medium">Belum ada warga terdaftar</p>
          </div>
        ) : (
          wargaList.map((w) => (
            <div
              key={w.nik}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 space-y-3 card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{w.nama_lengkap}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{w.nik}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ml-2 ${
                    w.status === 'aktif'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {w.status === 'aktif' ? '✅ Aktif' : '⛔ Nonaktif'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div>
                  <span className="text-gray-400">RT/RW:</span> {w.rt}/{w.rw}
                </div>
                <div>
                  <span className="text-gray-400">HP:</span> {w.no_hp}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => toggleStatus(w)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                    w.status === 'aktif'
                      ? 'bg-yellow-50 text-yellow-600'
                      : 'bg-green-50 text-green-600'
                  }`}
                >
                  {w.status === 'aktif' ? '⏸️ Nonaktifkan' : '▶️ Aktifkan'}
                </button>
                <button
                  onClick={() => openEdit(w)}
                  className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(w)}
                  className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold"
                >
                  🗑️ Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editMode ? 'Edit Warga' : 'Tambah Warga'}
        size="lg"
      >
        {/*
          ✅ TAMBAH autoComplete="off" pada <form> biar Chrome/Edge
          tidak autofill field No HP & Password
        */}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* NIK */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">NIK (16 digit)</label>
            <input
              type="text"
              name="warga_nik_kemantren"
              id="warga_nik_kemantren"
              autoComplete="off"
              value={form.nik}
              onChange={(e) => setForm({ ...form, nik: e.target.value })}
              maxLength={16}
              disabled={editMode}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:bg-gray-100"
              required
            />
          </div>

          {/* Nama */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap</label>
            <input
              type="text"
              name="warga_nama_lengkap_kemantren"
              id="warga_nama_lengkap_kemantren"
              autoComplete="off"
              value={form.nama_lengkap}
              onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              required
            />
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat</label>
            <textarea
              name="warga_alamat_kemantren"
              id="warga_alamat_kemantren"
              autoComplete="off"
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
              required
            />
          </div>

          {/* RT / RW */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">RT</label>
              <input
                type="text"
                name="warga_rt_kemantren"
                id="warga_rt_kemantren"
                autoComplete="off"
                value={form.rt}
                onChange={(e) => setForm({ ...form, rt: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">RW</label>
              <input
                type="text"
                name="warga_rw_kemantren"
                id="warga_rw_kemantren"
                autoComplete="off"
                value={form.rw}
                onChange={(e) => setForm({ ...form, rw: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                required
              />
            </div>
          </div>

          {/* No HP — ✅ FIX AUTOFILL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">No HP</label>
            <input
              type="tel"
              name="warga_nohp_kemantren"
              id="warga_nohp_kemantren"
              autoComplete="off"
              value={form.no_hp}
              onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              required
            />
          </div>

          {/* Password — ✅ FIX AUTOFILL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password{' '}
              {editMode && (
                <span className="text-xs text-gray-400">(kosongkan jika tidak diubah)</span>
              )}
            </label>
            <input
              type="password"
              name="warga_password_kemantren"
              id="warga_password_kemantren"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder={editMode ? '••••••' : 'Min 6 karakter'}
              required={!editMode}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 shadow-lg shadow-purple-500/30"
            >
              {editMode ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}