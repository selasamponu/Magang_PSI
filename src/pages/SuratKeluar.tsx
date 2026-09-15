import { useState, useEffect, useRef } from 'react';
import { SuratKeluarDB, SuratMasukDB, LogDB } from '../store/db';
import { SuratKeluar, SuratMasuk, User } from '../types';
import Modal from '../components/Modal';

interface Props {
  currentUser: User;
}

interface PengirimOption {
  nik: string;
  nama: string;
  id_surat: string;
  perihal_surat: string;
  tanggal_kirim: string;
}

export default function SuratKeluarPage({ currentUser }: Props) {
  const [suratList, setSuratList] = useState<SuratKeluar[]>([]);
  const [pengirimList, setPengirimList] = useState<PengirimOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string>('');
  const [form, setForm] = useState({
    nik_penerima: '',
    id_surat_masuk: '',
    nomor_surat: '',
    perihal: '',
  });
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [oldFileUrl, setOldFileUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SuratKeluar | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      const suratData = await SuratKeluarDB.getAll();
      setSuratList(
        suratData.sort(
          (a: SuratKeluar, b: SuratKeluar) =>
            new Date(b.tanggal_kirim).getTime() - new Date(a.tanggal_kirim).getTime()
        )
      );

      const masukData = await SuratMasukDB.getAll();
      const pengirimMap = new Map<string, PengirimOption>();
      masukData.forEach((m: SuratMasuk) => {
        const key = `${m.nik_pengirim}-${m.id_surat}`;
        if (!pengirimMap.has(key)) {
          pengirimMap.set(key, {
            nik: m.nik_pengirim,
            nama: m.nama_pengirim,
            id_surat: m.id_surat,
            perihal_surat: m.perihal,
            tanggal_kirim: m.tanggal_kirim,
          });
        }
      });
      setPengirimList(Array.from(pengirimMap.values()));
    } catch (err) {
      console.error('Error refresh:', err);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB!');
      return;
    }
    setFileObject(file);
    setFileName(file.name);
    setError('');
  };

  const resetForm = () => {
    setForm({
      nik_penerima: '',
      id_surat_masuk: '',
      nomor_surat: '',
      perihal: '',
    });
    setFileObject(null);
    setFileName('');
    setOldFileUrl('');
    setEditMode(false);
    setEditId('');
    setError('');
    setSuccess('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const openFormModal = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditModal = (surat: SuratKeluar) => {
    resetForm();
    setEditMode(true);
    setEditId(surat.id_surat_keluar);
    setForm({
      nik_penerima: surat.nik_penerima,
      id_surat_masuk: '',
      nomor_surat: surat.nomor_surat,
      perihal: surat.perihal,
    });
    setFileName(surat.file_name || '');
    setOldFileUrl(surat.file_url || '');
    setShowForm(true);
  };

  const closeFormModal = () => {
    setShowForm(false);
    resetForm();
  };

  const openDeleteModal = (surat: SuratKeluar) => {
    setDeleteTarget(surat);
    setShowDelete(true);
  };

  const closeDeleteModal = () => {
    setShowDelete(false);
    setDeleteTarget(null);
  };

  const handlePengirimChange = (value: string) => {
    const selected = pengirimList.find((p) => `${p.nik}||${p.id_surat}` === value);
    if (!selected) return;
    setForm({
      ...form,
      nik_penerima: selected.nik,
      id_surat_masuk: selected.id_surat,
      perihal: form.perihal || `Balasan: ${selected.perihal_surat}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.nik_penerima) {
      setError('⚠️ Pilih pengirim surat terlebih dahulu!');
      return;
    }
    if (!form.nomor_surat.trim()) {
      setError('⚠️ Nomor Surat harus diisi!');
      return;
    }
    if (!form.perihal.trim()) {
      setError('⚠️ Perihal harus diisi!');
      return;
    }
    if (!editMode && !fileObject) {
      setError('⚠️ File harus diupload!');
      return;
    }

    setLoading(true);
    try {
      if (editMode) {
        await SuratKeluarDB.update(
          editId,
          {
            nik_penerima: form.nik_penerima,
            nomor_surat: form.nomor_surat,
            perihal: form.perihal,
            file_url: oldFileUrl,
            file_name: fileName,
          },
          fileObject || undefined
        );

        await LogDB.create({
          user_id: currentUser.username,
          nama_user: currentUser.nama,
          user_type: 'user',
          aktivitas: 'UPDATE_SURAT_KELUAR',
          detail: `Update surat keluar ${editId}`,
        });

        setSuccess(`✅ Surat keluar berhasil diupdate! ID: ${editId}`);
      } else {
        const id = SuratKeluarDB.generateId();
        const penerima = pengirimList.find(
          (p) => p.nik === form.nik_penerima && p.id_surat === form.id_surat_masuk
        );

        await SuratKeluarDB.create(
          {
            id_surat_keluar: id,
            nik_penerima: form.nik_penerima,
            nama_penerima: penerima?.nama || '',
            nomor_surat: form.nomor_surat,
            perihal: form.perihal,
            qr_code_url: '',
            tanggal_kirim: new Date().toISOString(),
            status: 'terkirim',
          },
          fileObject!
        );

        await LogDB.create({
          user_id: currentUser.username,
          nama_user: currentUser.nama,
          user_type: 'user',
          aktivitas: 'BUAT_SURAT_KELUAR',
          detail: `Buat surat keluar ${id} untuk ${penerima?.nama}`,
        });

        setSuccess(`✅ Surat keluar berhasil dibuat! ID: ${id}`);
      }

      setForm({ nik_penerima: '', id_surat_masuk: '', nomor_surat: '', perihal: '' });
      setFileObject(null);
      setFileName('');
      setOldFileUrl('');
      if (fileRef.current) fileRef.current.value = '';

      await refresh();
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Gagal menyimpan surat keluar!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      await SuratKeluarDB.delete(deleteTarget.id_surat_keluar);

      await LogDB.create({
        user_id: currentUser.username,
        nama_user: currentUser.nama,
        user_type: 'user',
        aktivitas: 'HAPUS_SURAT_KELUAR',
        detail: `Hapus surat keluar ${deleteTarget.id_surat_keluar}`,
      });

      closeDeleteModal();
      await refresh();
    } catch (err: any) {
      console.error('❌ Error delete:', err);
      alert('Gagal menghapus surat: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">📤 Surat Keluar</h1>
          <p className="text-sm text-gray-500 mt-1">{suratList.length} surat keluar dibuat</p>
        </div>
        <button
          onClick={openFormModal}
          className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 hover-scale"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Buat Surat Keluar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm card-hover">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{suratList.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200 card-hover">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Terkirim</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">
            {suratList.filter((s) => s.status === 'terkirim').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 border border-green-200 card-hover">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Selesai</p>
          <p className="text-3xl font-bold text-green-700 mt-1">
            {suratList.filter((s) => s.status === 'selesai').length}
          </p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden card-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
              <tr>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">ID</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Penerima</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Nomor</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Perihal</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Tanggal</th>
                <th className="text-center px-5 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suratList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="text-6xl mb-3">📤</div>
                    <p className="text-gray-400 font-medium">Belum ada surat keluar</p>
                    <p className="text-gray-300 text-xs mt-1">Klik &quot;Buat Surat Keluar&quot; untuk membuat surat baru</p>
                  </td>
                </tr>
              ) : (
                suratList.map((s) => (
                  <tr key={s.id_surat_keluar} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-purple-600 font-semibold">{s.id_surat_keluar}</td>
                    <td className="px-5 py-4 font-semibold text-gray-800">{s.nama_penerima}</td>
                    <td className="px-5 py-4 text-xs font-mono text-gray-600">{s.nomor_surat}</td>
                    <td className="px-5 py-4 max-w-[200px] truncate text-gray-700">{s.perihal}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {new Date(s.tanggal_kirim).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5 justify-center">
                        <a
                          href={s.file_url?.startsWith('/uploads/') ? `http://${window.location.hostname}:5000${s.file_url}` : s.file_url}
                          download={s.file_name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-6-6m6 6l6-6m2 5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </a>

                        <button
                          onClick={() => openEditModal(s)}
                          className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>

                        <button
                          onClick={() => openDeleteModal(s)}
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
        {suratList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <div className="text-5xl mb-3">📤</div>
            <p className="text-gray-400 font-medium">Belum ada surat keluar</p>
          </div>
        ) : (
          suratList.map((s) => (
            <div key={s.id_surat_keluar} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 space-y-3 card-hover">
              <div>
                <p className="font-mono text-xs text-purple-600 font-semibold">{s.id_surat_keluar}</p>
                <p className="font-semibold text-gray-800 truncate mt-1">{s.nama_penerima}</p>
                <p className="text-xs text-gray-400 font-mono">{s.nomor_surat}</p>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{s.perihal}</p>
              <p className="text-xs text-gray-400">{new Date(s.tanggal_kirim).toLocaleDateString('id-ID')}</p>
              <div className="flex gap-2 pt-1">
                <a
                  href={s.file_url?.startsWith('/uploads/') ? `http://${window.location.hostname}:5000${s.file_url}` : s.file_url}
                  download={s.file_name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold text-center hover:bg-blue-100 transition-colors"
                >
                  📄 Download
                </a>
                <button
                  onClick={() => openEditModal(s)}
                  className="flex-1 py-2.5 bg-yellow-50 text-yellow-600 rounded-xl text-xs font-semibold hover:bg-yellow-100 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => openDeleteModal(s)}
                  className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors"
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
        onClose={closeFormModal}
        title={editMode ? 'Edit Surat Keluar' : 'Buat Surat Keluar (Balasan)'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editMode && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pilih Pengirim Surat <span className="text-red-500">*</span>
              </label>
              <select
                value={`${form.nik_penerima}||${form.id_surat_masuk}`}
                onChange={(e) => handlePengirimChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="">-- Pilih Pengirim Surat Masuk --</option>
                {pengirimList.length === 0 ? (
                  <option value="" disabled>Belum ada surat masuk</option>
                ) : (
                  pengirimList.map((p) => (
                    <option key={`${p.nik}-${p.id_surat}`} value={`${p.nik}||${p.id_surat}`}>
                      {p.nama} ({p.nik}) — {p.perihal_surat} [{p.id_surat}]
                    </option>
                  ))
                )}
              </select>
              {pengirimList.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ Belum ada surat masuk. Warga harus kirim surat dulu.
                </p>
              )}
            </div>
          )}

          {editMode && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">NIK Penerima</label>
              <input
                type="text"
                value={form.nik_penerima}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">NIK tidak bisa diubah saat edit</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nomor Surat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nomor_surat}
              onChange={(e) => setForm({ ...form, nomor_surat: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="001/KM/TR/2026"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Perihal <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.perihal}
              onChange={(e) => setForm({ ...form, perihal: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="Perihal surat balasan"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload File Surat {!editMode && <span className="text-red-500">*</span>}
              {editMode && <span className="text-xs text-gray-400 font-normal">(kosongkan jika tidak diubah)</span>}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`w-full py-6 border-2 border-dashed rounded-2xl text-center transition-all ${
                fileName
                  ? 'border-green-400 bg-green-50/50'
                  : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
              }`}
            >
              <div className="text-3xl mb-2">{fileName ? '✅' : '📁'}</div>
              <p className={`text-sm font-medium ${fileName ? 'text-green-700' : 'text-gray-600'}`}>
                {fileName || 'Klik untuk memilih file'}
              </p>
              {fileName && <p className="text-xs text-green-600 mt-1">
                {fileObject ? 'File baru siap diupload' : 'Menggunakan file lama'}
              </p>}
              {!fileName && (
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC, DOCX (max 5MB)</p>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-green-700 text-sm flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span>{success}</span>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={closeFormModal}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 shadow-lg shadow-purple-500/30"
            >
              {loading ? '⏳ Menyimpan...' : editMode ? '💾 Update' : '📤 Buat Surat Balasan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDelete}
        onClose={closeDeleteModal}
        title="Hapus Surat Keluar"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-3xl">
                🗑️
              </div>
              <div>
                <p className="font-bold text-red-700">Yakin hapus surat ini?</p>
                <p className="text-xs text-red-600 mt-0.5">Data tidak bisa dikembalikan!</p>
              </div>
            </div>
            {deleteTarget && (
              <div className="bg-white rounded-xl p-3 space-y-1">
                <p className="text-xs text-gray-500">ID Surat</p>
                <p className="font-mono text-sm font-bold text-red-600">{deleteTarget.id_surat_keluar}</p>
                <p className="text-xs text-gray-500 mt-2">Penerima</p>
                <p className="text-sm font-semibold">{deleteTarget.nama_penerima}</p>
                <p className="text-xs text-gray-500 mt-2">Perihal</p>
                <p className="text-sm">{deleteTarget.perihal}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={closeDeleteModal}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 shadow-lg shadow-red-500/30 disabled:opacity-50"
            >
              {loading ? '⏳ Menghapus...' : '🗑️ Hapus Surat'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}