import { useState, useEffect, useRef } from 'react';
import { SuratMasukDB, KategoriDB, LogDB } from '../store/db';
import { Warga, Kategori } from '../types';

interface Props {
  warga: Warga;
  onNavigate: (page: string) => void;
}

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_IMAGE_DIMENSION = 1600; // px — kompresi otomatis
const IMAGE_QUALITY = 0.75; // 75% kualitas JPEG

/**
 * Kompres gambar menggunakan Canvas API.
 * Mengembalikan File baru yang sudah dikecilkan.
 */
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;

        // Hitung skala proporsional
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
            width = MAX_IMAGE_DIMENSION;
          } else {
            width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
            height = MAX_IMAGE_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas tidak didukung'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Gagal kompres gambar'));
              return;
            }
            // Buat nama file baru dengan ekstensi .jpg
            const baseName = file.name.replace(/\.[^.]+$/, '');
            const newFile = new File([blob], `${baseName}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          'image/jpeg',
          IMAGE_QUALITY
        );
      };
      img.onerror = () => reject(new Error('Gagal membaca gambar'));
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
  });
}

export default function KirimSurat({ warga, onNavigate }: Props) {
  const [metode, setMetode] = useState<'scan' | 'upload'>('upload');
  const [kategori, setKategori] = useState('');
  const [perihal, setPerihal] = useState('');
  const [catatan, setCatatan] = useState('');
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadKategori = async () => {
      try {
        const data = await KategoriDB.getAll();
        setKategoriList(data);
      } catch (err) {
        console.error('Error loading kategori:', err);
      }
    };
    loadKategori();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setError('');
    setFileObject(null);
    setFileName('');
    setFileSize(0);

    // Validasi ekstensi
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError('Format file tidak didukung! Hanya PDF, JPG, JPEG, PNG.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      return;
    }

    // ==== JIKA FILE ADALAH GAMBAR ====
    if (['jpg', 'jpeg', 'png'].includes(ext)) {
      setCompressing(true);
      try {
        // Kompres otomatis
        const compressed = await compressImage(file);

        // Cek apakah setelah kompres masih > 2 MB (kasus ekstrem)
        if (compressed.size > MAX_FILE_SIZE) {
          // Coba kompres lagi dengan kualitas lebih rendah
          const compressed2 = await compressImage(compressed);
          if (compressed2.size > MAX_FILE_SIZE) {
            setError(
              `Foto terlalu besar (${formatSize(compressed2.size)}). ` +
              `Silakan ambil foto dengan resolusi lebih rendah atau jarak lebih jauh.`
            );
            setCompressing(false);
            if (cameraInputRef.current) cameraInputRef.current.value = '';
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
          setFileObject(compressed2);
          setFileName(compressed2.name);
          setFileSize(compressed2.size);
        } else {
          setFileObject(compressed);
          setFileName(compressed.name);
          setFileSize(compressed.size);
        }
      } catch (err: any) {
        console.error('Compress error:', err);
        setError('Gagal memproses gambar. Coba lagi.');
      } finally {
        setCompressing(false);
      }
      return;
    }

    // ==== JIKA FILE ADALAH PDF ====
    if (file.size > MAX_FILE_SIZE) {
      setError(`File PDF terlalu besar (${formatSize(file.size)}). Maksimal 2 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileObject(file);
    setFileName(file.name);
    setFileSize(file.size);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fileObject) { setError('File harus diupload!'); return; }
    if (!kategori) { setError('Kategori harus dipilih!'); return; }
    if (!perihal.trim()) { setError('Perihal harus diisi!'); return; }

    setLoading(true);
    try {
      const id = SuratMasukDB.generateId();
      await SuratMasukDB.create(
        {
          id_surat: id,
          nik_pengirim: warga.nik,
          nama_pengirim: warga.nama_lengkap,
          metode,
          kategori,
          perihal,
          catatan,
          status: 'terkirim',
          tanggal_kirim: new Date().toISOString(),
          tanggal_verifikasi: null,
          diverifikasi_oleh: null,
          alasan_tolak: null,
        },
        fileObject
      );

      await LogDB.create({
        user_id: warga.nik,
        nama_user: warga.nama_lengkap,
        user_type: 'warga',
        aktivitas: 'KIRIM_SURAT',
        detail: `Kirim surat ${id} - ${perihal}`,
      });

      setSuccess(`Surat berhasil dikirim! ID: ${id}`);
      setFileObject(null);
      setFileName('');
      setFileSize(0);
      setPerihal('');
      setCatatan('');
      setKategori('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } catch (err: any) {
      console.error('Error kirim surat:', err);
      setError(err.message || 'Gagal mengirim surat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">📝 Kirim Surat</h1>
        <p className="text-sm text-gray-500 mt-1">Kirim surat ke Kemantren Tegalrejo</p>
      </div>

      {/* Pilih Metode */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-lg">📤</span> Pilih Metode Pengiriman
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMetode('scan')}
            className={`p-5 rounded-2xl border-2 text-center transition-all ${
              metode === 'scan'
                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
                : 'border-gray-200 hover:border-purple-300 bg-white'
            }`}
          >
            <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-3 ${
              metode === 'scan' ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg' : 'bg-gray-100'
            }`}>
              📷
            </div>
            <p className={`font-semibold text-sm ${metode === 'scan' ? 'text-purple-700' : 'text-gray-700'}`}>
              Scan Surat Fisik
            </p>
            <p className="text-xs text-gray-500 mt-1">Foto surat kertas</p>
          </button>
          <button
            type="button"
            onClick={() => setMetode('upload')}
            className={`p-5 rounded-2xl border-2 text-center transition-all ${
              metode === 'upload'
                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
                : 'border-gray-200 hover:border-purple-300 bg-white'
            }`}
          >
            <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-3 ${
              metode === 'upload' ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg' : 'bg-gray-100'
            }`}>
              📁
            </div>
            <p className={`font-semibold text-sm ${metode === 'upload' ? 'text-purple-700' : 'text-gray-700'}`}>
              Upload File
            </p>
            <p className="text-xs text-gray-500 mt-1">PDF / JPG / PNG</p>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-5">
        {/* Upload File */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Upload File <span className="text-gray-400 font-normal">(max 2MB)</span>
          </label>
          {metode === 'scan' ? (
            <div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={compressing}
                className="w-full py-10 border-2 border-dashed border-gray-300 rounded-2xl text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all group disabled:opacity-50"
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                  {compressing ? '⏳' : '📷'}
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  {compressing
                    ? 'Mengompres foto...'
                    : fileName || 'Klik untuk mengambil foto'}
                </p>
                {fileSize > 0 && !compressing && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    ✅ Ukuran: {formatSize(fileSize)}
                  </p>
                )}
                {!fileName && !compressing && (
                  <p className="text-xs text-gray-400 mt-1">
                    Foto otomatis dikompres agar tidak melebihi 2MB
                  </p>
                )}
              </button>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing}
                className={`w-full py-10 border-2 border-dashed rounded-2xl text-center transition-all group disabled:opacity-50 ${
                  fileName
                    ? 'border-green-400 bg-green-50/50'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                }`}
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                  {compressing ? '⏳' : fileName ? '✅' : '📁'}
                </div>
                <p className={`text-sm font-semibold ${fileName ? 'text-green-700' : 'text-gray-700'}`}>
                  {compressing ? 'Mengompres gambar...' : fileName || 'Klik untuk memilih file'}
                </p>
                {fileSize > 0 && !compressing && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    ✅ Ukuran: {formatSize(fileSize)}
                  </p>
                )}
                {!fileName && !compressing && (
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, JPG, JPEG, PNG (max 2MB) — Gambar otomatis dikompres
                  </p>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Kategori Surat <span className="text-red-500">*</span>
          </label>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            required
          >
            <option value="">-- Pilih Kategori --</option>
            {kategoriList.map((k) => (
              <option key={k.id_kategori} value={k.nama_kategori}>
                {k.nama_kategori}
              </option>
            ))}
          </select>
        </div>

        {/* Perihal */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Perihal Surat <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={perihal}
            onChange={(e) => setPerihal(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="Contoh: Undangan Rapat RT"
            required
          />
        </div>

        {/* Catatan */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Catatan <span className="text-gray-400 font-normal">(opsional)</span>
          </label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
            placeholder="Tambahkan catatan..."
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-600 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-green-700 text-sm">
            <div className="flex items-center gap-2 mb-2">
              <span>✅</span> <strong>{success}</strong>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('riwayat-surat')}
              className="text-green-700 underline font-semibold hover:text-green-800"
            >
              → Lihat Riwayat Surat
            </button>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || compressing}
          className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white font-bold rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/40 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Mengirim...
            </>
          ) : compressing ? (
            <>⏳ Mengompres foto...</>
          ) : (
            <>📤 Kirim Surat</>
          )}
        </button>
      </form>
    </div>
  );
}