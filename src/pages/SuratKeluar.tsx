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

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

export default function SuratKeluarPage({ currentUser }: Props) {
  const [suratList, setSuratList] = useState<SuratKeluar[]>([]);
  const [pengirimList, setPengirimList] = useState<PengirimOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string>('');
  const [form, setForm] = useState({ nik_penerima: '', id_surat_masuk: '', nomor_surat: '', perihal: '' });
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
      setSuratList(suratData.sort((a: SuratKeluar, b: SuratKeluar) =>
        new Date(b.tanggal_kirim).getTime() - new Date(a.tanggal_kirim).getTime()
      ));
      const masukData = await SuratMasukDB.getAll();
      const pengirimMap = new Map<string, PengirimOption>();
      masukData.forEach((m: SuratMasuk) => {
        const key = `${m.nik_pengirim}-${m.id_surat}`;
        if (!pengirimMap.has(key)) {
          pengirimMap.set(key, {
            nik: m.nik_pengirim, nama: m.nama_pengirim, id_surat: m.id_surat,
            perihal_surat: m.perihal, tanggal_kirim: m.tanggal_kirim,
          });
        }
      });
      setPengirimList(Array.from(pengirimMap.values()));
    } catch (err) { console.error('Error refresh:', err); }
  };

  useEffect(() => { refresh(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError('Format file tidak didukung! Hanya PDF, JPG, JPEG, PNG.');
      setFileObject(null);
      setFileName('');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran file maksimal 2MB!');
      setFileObject(null);
      setFileName('');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setFileObject(file);
    setFileName(file.name);
    setError('');
  };

  const resetForm = () => {
    setForm({ nik_penerima: '', id_surat_masuk: '', nomor_surat: '', perihal: '' });
    setFileObject(null); setFileName(''); setOldFileUrl('');
    setEditMode(false); setEditId(''); setError(''); setSuccess('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const openFormModal = () => { resetForm(); setShowForm(true); };

  const openEditModal = (surat: SuratKeluar) => {
    resetForm();
    setEditMode(true); setEditId(surat.id_surat_keluar);
    setForm({ nik_penerima: surat.nik_penerima, id_surat_masuk: '', nomor_surat: surat.nomor_surat, perihal: surat.perihal });
    setFileName(surat.file_name || ''); setOldFileUrl(surat.file_url || '');
    setShowForm(true);
  };

  const closeFormModal = () => { setShowForm(false); resetForm(); };

  const openDeleteModal = (surat: SuratKeluar) => { setDeleteTarget(surat); setShowDelete(true); };
  const closeDeleteModal = () => { setShowDelete(false); setDeleteTarget(null); };

  const handlePengirimChange = (value: string) => {
    const selected = pengirimList.find((p) => `${p.nik}||${p.id_surat}` === value);
    if (!selected) return;
    setForm({ ...form, nik_penerima: selected.nik, id_surat_masuk: selected.id_surat, perihal: form.perihal || `Balasan: ${selected.perihal_surat}` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.nik_penerima) { setError('Pilih pengirim surat terlebih dahulu!'); return; }
    if (!form.nomor_surat.trim()) { setError('Nomor Surat harus diisi!'); return; }
    if (!form.perihal.trim()) { setError('Perihal harus diisi!'); return; }
    if (!editMode && !fileObject) { setError('File harus diupload!'); return; }
    setLoading(true);
    try {
      if (editMode) {
        await SuratKeluarDB.update(editId, {
          nik_penerima: form.nik_penerima, nomor_surat: form.nomor_surat,
          perihal: form.perihal, file_url: oldFileUrl, file_name: fileName,
        }, fileObject || undefined);
        await LogDB.create({
          user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user',
          aktivitas: 'UPDATE_SURAT_KELUAR', detail: `Update surat keluar ${editId}`,
        });
        setSuccess(`Surat keluar berhasil diupdate! ID: ${editId}`);
      } else {
        const id = SuratKeluarDB.generateId();
        const penerima = pengirimList.find((p) => p.nik === form.nik_penerima && p.id_surat === form.id_surat_masuk);
        await SuratKeluarDB.create({
          id_surat_keluar: id, nik_penerima: form.nik_penerima, nama_penerima: penerima?.nama || '',
          nomor_surat: form.nomor_surat, perihal: form.perihal, qr_code_url: '',
          tanggal_kirim: new Date().toISOString(), status: 'terkirim',
        }, fileObject!);
        await LogDB.create({
          user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user',
          aktivitas: 'BUAT_SURAT_KELUAR', detail: `Buat surat keluar ${id} untuk ${penerima?.nama}`,
        });
        setSuccess(`Surat keluar berhasil dibuat! ID: ${id}`);
      }
      setForm({ nik_penerima: '', id_surat_masuk: '', nomor_surat: '', perihal: '' });
      setFileObject(null); setFileName(''); setOldFileUrl('');
      if (fileRef.current) fileRef.current.value = '';
      await refresh();
    } catch (err: any) {
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
        user_id: currentUser.username, nama_user: currentUser.nama, user_type: 'user',
        aktivitas: 'HAPUS_SURAT_KELUAR', detail: `Hapus surat keluar ${deleteTarget.id_surat_keluar}`,
      });
      closeDeleteModal();
      await refresh();
    } catch (err: any) {
      alert('Gagal menghapus surat: ' + (err.message || 'Unknown error'));
    } finally { setLoading(false); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      terkirim: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
      dibaca: 'bg-sky-100 text-sky-700 border border-sky-200',
      selesai: 'bg-green-100 text-green-700 border border-green-200',
    };
    return map[status] || 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const statusIcon = (status: string) => {
    const map: Record<string, string> = { terkirim: '📬', dibaca: '👁️', selesai: '✅' };
    return map[status] || '📄';
  };

  const stats = {
    total: suratList.length,
    terkirim: suratList.filter(s => s.status === 'terkirim').length,
    selesai: suratList.filter(s => s.status === 'selesai').length,
  };

  return (
    <div className="space-y-4 sm:space-y-5">
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

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-white rounded-xl p-3 border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm shadow-sm flex-shrink-0">📋</div>
            <p className="text-[11px] font-medium text-gray-600 leading-tight">Total</p>
          </div>
          <p className="text-2xl font-bold text-gray-800 leading-none">{stats.total}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">📬</div>
            <p className="text-[11px] font-medium text-indigo-700 leading-tight">Terkirim</p>
          </div>
          <p className="text-2xl font-bold text-indigo-700 leading-none">{stats.terkirim}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border border-green-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">✅</div>
            <p className="text-[11px] font-medium text-green-700 leading-tight">Selesai</p>
          </div>
          <p className="text-2xl font-bold text-green-700 leading-none">{stats.selesai}</p>
        </div>
      </div>

      {/* DAFTAR SURAT KELUAR */}
      {suratList.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
          <div className="text-6xl mb-3">📤</div>
          <p className="text-gray-400 font-medium">Belum ada surat keluar</p>
          <p className="text-gray-300 text-xs mt-1">Klik &quot;Buat Surat Keluar&quot; untuk membuat surat baru</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suratList.map((s, idx) => (
            <div
              key={s.id_surat_keluar}
              className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50/20 hover:shadow-lg transition-all duration-200"
            >
              <div className="hidden sm:flex items-center justify-center w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-bold shadow-md flex-shrink-0">
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start sm:items-center gap-2 flex-wrap mb-1.5">
                  <p className="font-mono text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                    {s.id_surat_keluar}
                  </p>
                  <span className="font-mono text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                    {s.nomor_surat}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">👤</span>
                  <p className="font-semibold text-gray-800 truncate">{s.nama_penerima}</p>
                </div>
                <p className="text-xs text-gray-400 font-mono truncate">{s.nik_penerima}</p>
              </div>

              <div className="flex-1 min-w-0 sm:border-l sm:border-gray-100 sm:pl-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Perihal</p>
                <p className="text-sm text-gray-700 line-clamp-2">{s.perihal}</p>
              </div>

              <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 sm:hidden">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusBadge(s.status)}`}>
                  <span>{statusIcon(s.status)}</span>
                  <span className="capitalize">{s.status}</span>
                </span>
              </div>

              <div className="flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4 sm:min-w-[110px]">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 sm:hidden">Tanggal</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>📅</span>
                  <span className="whitespace-nowrap">
                    {new Date(s.tanggal_kirim).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="flex gap-1.5 flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
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
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      <Modal
        isOpen={showForm}
        onClose={closeFormModal}
        title={editMode ? 'Edit Surat Keluar' : 'Buat Surat Keluar (Balasan)'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {editMode && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-300">Mode Edit</p>
              <p className="text-xs text-amber-200/80 mt-1">
                NIK Penerima tidak bisa diubah. Hanya nomor surat, perihal, dan file yang dapat diperbarui.
              </p>
            </div>
          )}

          {!editMode && (
            <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                Pilih Pengirim Surat <span className="text-red-400">*</span>
              </label>
              <select
                value={`${form.nik_penerima}||${form.id_surat_masuk}`}
                onChange={(e) => handlePengirimChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all"
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
                <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-xs text-red-300">Belum ada surat masuk. Warga harus kirim surat terlebih dahulu.</p>
                </div>
              )}
            </div>
          )}

          {editMode && (
            <div>
              <label className="block text-sm font-semibold text-amber-400 mb-2">
                NIK Penerima
              </label>
              <input
                type="text"
                value={form.nik_penerima}
                disabled
                className="w-full px-4 py-3 bg-gray-200 border-2 border-gray-300 rounded-xl text-sm text-gray-600 font-mono cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">NIK tidak bisa diubah saat edit</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-amber-400 mb-2">
              Nomor Surat <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.nomor_surat}
              onChange={(e) => setForm({ ...form, nomor_surat: e.target.value })}
              className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all font-mono"
              placeholder="001/KM/TR/2026"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-amber-400 mb-2">
              Perihal <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.perihal}
              onChange={(e) => setForm({ ...form, perihal: e.target.value })}
              className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all"
              placeholder="Perihal surat balasan"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-amber-400 mb-2">
              Upload File Surat
              {!editMode && <span className="text-red-400"> *</span>}
              {editMode && <span className="text-xs text-gray-400 font-normal"> (kosongkan jika tidak diubah)</span>}
            </label>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`w-full py-8 border-2 border-dashed rounded-2xl text-center transition-all ${
                fileName
                  ? 'border-green-500/60 bg-green-500/10'
                  : 'border-gray-600 hover:border-amber-500/60 hover:bg-amber-500/5'
              }`}
            >
              <div className="text-4xl mb-3">{fileName ? '✅' : '📁'}</div>
              <p className={`text-sm font-semibold ${fileName ? 'text-green-300' : 'text-gray-300'}`}>
                {fileName || 'Klik untuk memilih file'}
              </p>
              {fileName && (
                <p className="text-xs text-green-400 mt-1">{fileObject ? 'File baru siap diupload' : 'Menggunakan file lama'}</p>
              )}
              {!fileName && <p className="text-xs text-gray-500 mt-1">PDF, JPG, JPEG, PNG (max 2MB)</p>}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border-2 border-red-500/40 rounded-xl p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border-2 border-green-500/40 rounded-xl p-4 text-green-300 text-sm">
              {success}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-3 border-t border-gray-700/50">
            <button
              type="button"
              onClick={closeFormModal}
              className="px-5 py-2.5 border border-gray-600 rounded-xl text-sm font-semibold text-gray-300 hover:bg-gray-700/30 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Menyimpan...
                </>
              ) : editMode ? 'Update' : 'Buat Surat Balasan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDelete} onClose={closeDeleteModal} title="Hapus Surat Keluar">
        <div className="space-y-4">
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-3xl">🗑️</div>
              <div>
                <p className="font-bold text-red-300">Yakin hapus surat ini?</p>
                <p className="text-xs text-red-400 mt-0.5">Data tidak bisa dikembalikan!</p>
              </div>
            </div>
            {deleteTarget && (
              <div className="bg-gray-800/50 rounded-xl p-3 space-y-1 border border-gray-700/50">
                <p className="text-xs text-amber-400 uppercase tracking-wider">ID Surat</p>
                <p className="font-mono text-sm font-bold text-red-300">{deleteTarget.id_surat_keluar}</p>
                <p className="text-xs text-amber-400 uppercase tracking-wider mt-2">Penerima</p>
                <p className="text-sm font-semibold text-white">{deleteTarget.nama_penerima}</p>
                <p className="text-xs text-amber-400 uppercase tracking-wider mt-2">Perihal</p>
                <p className="text-sm text-white">{deleteTarget.perihal}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={closeDeleteModal}
              className="px-5 py-2.5 border border-gray-600 rounded-xl text-sm font-semibold text-gray-300 hover:bg-gray-700/30 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 shadow-lg shadow-red-500/30 disabled:opacity-50"
            >
              {loading ? 'Menghapus...' : 'Hapus Surat'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}