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
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      let data = await WargaDB.getAll();
      if (search) {
        const q = search.toLowerCase();
        data = data.filter((w: Warga) =>
          w.nama_lengkap.toLowerCase().includes(q) || w.nik.includes(q) || w.alamat.toLowerCase().includes(q)
        );
      }
      setWargaList(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [search]);

  const openAdd = () => {
    setForm({ nik: '', nama_lengkap: '', alamat: '', rt: '', rw: '', no_hp: '', password: '' });
    setEditMode(false); setError(''); setShowForm(true);
  };

  const openEdit = (w: Warga) => {
    setForm({ nik: w.nik, nama_lengkap: w.nama_lengkap, alamat: w.alamat, rt: w.rt, rw: w.rw, no_hp: w.no_hp, password: '' });
    setEditMode(true); setError(''); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!editMode && form.nik.length !== 16) { setError('NIK harus 16 digit!'); return; }
    if (!editMode && (!form.password || form.password.length < 6)) { setError('Password minimal 6 karakter!'); return; }
    try {
      if (editMode) {
        const updateData: any = {
          nama_lengkap: form.nama_lengkap, alamat: form.alamat, rt: form.rt, rw: form.rw, no_hp: form.no_hp,
        };
        if (form.password) updateData.password = form.password;
        await WargaDB.update(form.nik, updateData);
        await LogDB.create({
          user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user',
          aktivitas: 'UPDATE_WARGA', detail: `Update warga ${form.nik}`,
        });
      } else {
        const existing = await WargaDB.getByNik(form.nik);
        if (existing) { setError('NIK sudah terdaftar!'); return; }
        await WargaDB.create({ ...form, status: 'aktif', tanggal_daftar: new Date().toISOString(), terakhir_login: null });
        await LogDB.create({
          user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user',
          aktivitas: 'TAMBAH_WARGA', detail: `Tambah warga ${form.nik} - ${form.nama_lengkap}`,
        });
      }
      setShowForm(false); await refresh();
    } catch (err: any) { setError(err.message || 'Gagal menyimpan data'); }
  };

  const toggleStatus = async (w: Warga) => {
    try {
      const newStatus = w.status === 'aktif' ? 'nonaktif' : 'aktif';
      await WargaDB.updateStatus(w.nik, newStatus);
      await LogDB.create({
        user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user',
        aktivitas: 'UPDATE_WARGA', detail: `Status ${w.nik} diubah ke ${newStatus}`,
      });
      await refresh();
    } catch (err) { alert('Gagal update status'); }
  };

  const handleDelete = async (w: Warga) => {
    if (confirm(`Hapus warga ${w.nama_lengkap}?`)) {
      try {
        await WargaDB.delete(w.nik);
        await LogDB.create({
          user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user',
          aktivitas: 'HAPUS_WARGA', detail: `Hapus warga ${w.nik}`,
        });
        await refresh();
      } catch (err) { alert('Gagal menghapus warga'); }
    }
  };

  const stats = {
    total: wargaList.length,
    aktif: wargaList.filter((w) => w.status === 'aktif').length,
    nonaktif: wargaList.filter((w) => w.status === 'nonaktif').length,
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">👥 Kelola Warga</h1>
          <p className="text-sm text-gray-500 mt-1">{wargaList.length} warga terdaftar</p>
        </div>
        <button onClick={openAdd} className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 hover-scale">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Warga
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-white rounded-xl p-3 border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm shadow-sm flex-shrink-0">👥</div>
            <p className="text-[11px] font-medium text-gray-600 leading-tight">Total Warga</p>
          </div>
          <p className="text-2xl font-bold text-gray-800 leading-none">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border border-green-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">✅</div>
            <p className="text-[11px] font-medium text-green-700 leading-tight">Aktif</p>
          </div>
          <p className="text-2xl font-bold text-green-700 leading-none">{stats.aktif}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">⛔</div>
            <p className="text-[11px] font-medium text-red-700 leading-tight">Nonaktif</p>
          </div>
          <p className="text-2xl font-bold text-red-700 leading-none">{stats.nonaktif}</p>
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
            name="search_warga_kemantren"
            autoComplete="off"
            placeholder="Cari nama, NIK, atau alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
      </div>

      {/* DAFTAR WARGA — CARD */}
      {wargaList.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
          <div className="text-6xl mb-3">👥</div>
          <p className="text-gray-400 font-medium">Belum ada warga terdaftar</p>
          <p className="text-gray-300 text-xs mt-1">Klik &quot;Tambah Warga&quot; untuk menambahkan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wargaList.map((w, idx) => (
            <div
              key={w.nik}
              className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50/20 hover:shadow-lg transition-all duration-200"
            >
              <div className="hidden sm:flex items-center justify-center w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl text-sm font-bold shadow-md flex-shrink-0">
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">👤</span>
                  <p className="font-semibold text-gray-800 truncate">{w.nama_lengkap}</p>
                </div>
                <p className="font-mono text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-md inline-block">
                  {w.nik}
                </p>
              </div>

              <div className="flex-1 min-w-0 sm:border-l sm:border-gray-100 sm:pl-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Alamat</p>
                <p className="text-sm text-gray-700 line-clamp-2">{w.alamat}</p>
                <p className="text-xs text-gray-400 mt-1">📍 RT {w.rt} / RW {w.rw}</p>
              </div>

              <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4 sm:min-w-[130px]">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">No HP</p>
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  <span>📱</span>
                  <span className="whitespace-nowrap">{w.no_hp}</span>
                </div>
              </div>

              <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 sm:hidden">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  w.status === 'aktif'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {w.status === 'aktif' ? '✅ Aktif' : '⛔ Nonaktif'}
                </span>
              </div>

              <div className="flex gap-1.5 flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
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
                <button onClick={() => openEdit(w)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Edit">
                  ✏️
                </button>
                <button onClick={() => handleDelete(w)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Hapus">
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
        title={editMode ? 'Edit Warga' : 'Tambah Warga'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">

          {/* Info Box Mode Edit */}
          {editMode && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-300">Mode Edit</p>
              <p className="text-xs text-amber-200/80 mt-1">
                NIK tidak bisa diubah. Kosongkan password jika tidak ingin mengubahnya.
              </p>
            </div>
          )}

          {/* Section Identitas — DARK CARD */}
          <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50 space-y-4">

            {/* NIK */}
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                NIK (16 digit) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="warga_nik_kemantren"
                id="warga_nik_kemantren"
                autoComplete="off"
                value={form.nik}
                onChange={(e) => setForm({ ...form, nik: e.target.value })}
                maxLength={16}
                disabled={editMode}
                className={`w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all ${
                  editMode ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : ''
                }`}
                placeholder="32xxxxxxxxxxxxxx"
                required
              />
              {editMode && <p className="text-xs text-gray-400 mt-1">NIK tidak bisa diubah saat edit</p>}
            </div>

            {/* Nama Lengkap */}
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                Nama Lengkap <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="warga_nama_lengkap_kemantren"
                id="warga_nama_lengkap_kemantren"
                autoComplete="off"
                value={form.nama_lengkap}
                onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all"
                placeholder="Nama lengkap warga"
                required
              />
            </div>

            {/* Alamat */}
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                Alamat <span className="text-red-400">*</span>
              </label>
              <textarea
                name="warga_alamat_kemantren"
                id="warga_alamat_kemantren"
                autoComplete="off"
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all resize-none"
                placeholder="Alamat lengkap (jalan, nomor rumah, kecamatan)"
                required
              />
            </div>

            {/* RT & RW */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-amber-400 mb-2">
                  RT <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="warga_rt_kemantren"
                  id="warga_rt_kemantren"
                  autoComplete="off"
                  value={form.rt}
                  onChange={(e) => setForm({ ...form, rt: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all"
                  placeholder="001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-400 mb-2">
                  RW <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="warga_rw_kemantren"
                  id="warga_rw_kemantren"
                  autoComplete="off"
                  value={form.rw}
                  onChange={(e) => setForm({ ...form, rw: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all"
                  placeholder="002"
                  required
                />
              </div>
            </div>

            {/* No HP */}
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                No HP <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                name="warga_nohp_kemantren"
                id="warga_nohp_kemantren"
                autoComplete="off"
                value={form.no_hp}
                onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all"
                placeholder="08xxxxxxxxxx"
                required
              />
            </div>
          </div>

          {/* Section Password */}
          <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50 space-y-3">
            <div>
              <p className="text-sm font-semibold text-amber-400">Password Akun</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {editMode ? 'Kosongkan jika tidak ingin mengubah password' : 'Minimal 6 karakter'}
              </p>
            </div>
            <input
              type="password"
              name="warga_password_kemantren"
              id="warga_password_kemantren"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all"
              placeholder={editMode ? '•••••• (biarkan kosong jika tidak diubah)' : 'Minimal 6 karakter'}
              required={!editMode}
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