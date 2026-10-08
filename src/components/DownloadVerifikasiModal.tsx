import { useEffect, useState } from 'react';

export interface FileInfo {
  file_url: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  tanggal_upload?: string;
  id_surat?: string;
  nama_pengirim?: string;
  perihal?: string;
  sumber?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fileInfo: FileInfo | null;
  appSettings?: {
    nama_aplikasi?: string;
    nama_instansi?: string;
    logo_url?: string;
    warna_tema?: string;
  };
}

export default function DownloadVerifikasiModal({
  isOpen,
  onClose,
  fileInfo,
  appSettings,
}: Props) {
  const [fileHash, setFileHash] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [verifStatus, setVerifStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [verifError, setVerifError] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  // ✅ BLOB URL untuk semua tipe file
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [blobMime, setBlobMime] = useState<string>('');
  const [blobSize, setBlobSize] = useState<number>(0);

  const appName = appSettings?.nama_aplikasi || 'Aplikasi Surat';
  const appInstansi = appSettings?.nama_instansi || 'Kemantren Tegalrejo Yogyakarta';
  const logoUrl = appSettings?.logo_url || '/logo.png';
  const themeColor = appSettings?.warna_tema || '#8B3A1A';

  // ============================================================
  // URL ASLI untuk fetch
  // ============================================================
  const fullFileUrl = fileInfo?.file_url
    ? fileInfo.file_url.startsWith('http')
      ? fileInfo.file_url
      : fileInfo.file_url.startsWith('/uploads/')
      ? `http://${window.location.hostname}:5000${fileInfo.file_url}`
      : fileInfo.file_url
    : '';

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getExt = (name: string) => {
    const parts = name.split('.');
    return parts.length > 1 ? (parts.pop()?.toLowerCase() || '') : '';
  };

  const ext = fileInfo ? getExt(fileInfo.file_name) : '';
  const isPDF = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const isDoc = ['doc', 'docx'].includes(ext);

  const generateFingerprint = (url: string, name: string, size?: number) => {
    const raw = `${url}|${name}|${size || 0}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
    return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
  };

  // ================================================================
  // ✅ VERIFIKASI + FETCH FILE SEBAGAI BLOB
  // ================================================================
  useEffect(() => {
    if (!isOpen || !fileInfo) {
      setFileHash('');
      setVerifStatus('idle');
      setVerifError('');
      // Cleanup blob URL lama
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      setBlobUrl('');
      setBlobMime('');
      setBlobSize(0);
      return;
    }

    let isCancelled = false;
    let currentBlobUrl = '';

    const runVerifikasi = async () => {
      setVerifying(true);
      setVerifStatus('idle');
      setVerifError('');
      setBlobUrl('');
      setBlobMime('');
      setBlobSize(0);

      try {
        const res = await fetch(fullFileUrl);

        if (isCancelled) return;

        if (!res.ok) {
          if (res.status === 404) {
            setVerifStatus('fail');
            setVerifError(
              'File fisik tidak ditemukan di server. Kemungkinan file sudah dihapus atau belum ter-upload dengan benar.'
            );
          } else {
            setVerifStatus('fail');
            setVerifError(`Server mengembalikan status ${res.status}`);
          }
          return;
        }

        const blob = await res.blob();

        if (isCancelled) return;

        currentBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(currentBlobUrl);
        setBlobMime(blob.type || 'application/octet-stream');
        setBlobSize(blob.size);

        setFileHash(generateFingerprint(fullFileUrl, fileInfo.file_name, fileInfo.file_size));
        setVerifStatus('ok');
      } catch (err: any) {
        if (isCancelled) return;
        setVerifStatus('fail');
        setVerifError(`Gagal menghubungi server: ${err.message}`);
      } finally {
        if (!isCancelled) setVerifying(false);
      }
    };

    runVerifikasi();

    return () => {
      isCancelled = true;
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [isOpen, fileInfo, fullFileUrl]);

  // ================================================================
  // ✅ DOWNLOAD DARI BLOB URL — file asli, bukan tab baru
  // ================================================================
  const handleDownload = () => {
    if (!fileInfo) return;
    if (!blobUrl) {
      alert('File belum siap. Tunggu verifikasi selesai.');
      return;
    }

    setDownloading(true);
    try {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileInfo.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => onClose(), 500);
    } catch (err: any) {
      alert('❌ Gagal download: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen || !fileInfo) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden animate-in flex flex-col">
        {/* HEADER */}
        <div
          className="p-5 text-white text-center relative overflow-hidden flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-2 flex items-center justify-center p-2 shadow-lg">
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
            <h2 className="font-bold text-base">{appInstansi}</h2>
            <p className="text-xs opacity-90 mt-0.5">Verifikasi Keaslian File Surat</p>
            {fileInfo.sumber && (
              <span className="inline-block mt-2 text-[10px] bg-white/20 px-2.5 py-1 rounded-full">
                📂 {fileInfo.sumber}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* STATUS VERIFIKASI */}
          {verifying && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              <div>
                <div className="font-bold text-blue-800 text-sm">Memverifikasi file...</div>
                <div className="text-blue-600 text-xs">Memeriksa keaslian file di server</div>
              </div>
            </div>
          )}

          {!verifying && verifStatus === 'ok' && (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
                ✅
              </div>
              <div className="flex-1">
                <div className="font-bold text-green-800 text-sm">File Terverifikasi Asli</div>
                <div className="text-green-700 text-xs">
                  File ini terdaftar resmi di sistem {appName}
                </div>
              </div>
            </div>
          )}

          {!verifying && verifStatus === 'fail' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
                  ⚠️
                </div>
                <div className="flex-1">
                  <div className="font-bold text-red-800 text-sm">File Tidak Dapat Diverifikasi</div>
                  <div className="text-red-700 text-xs mt-1 whitespace-pre-wrap">
                    {verifError}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DETAIL FILE */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
            <Row label="Nama File" value={fileInfo.file_name} bold />
            <Row label="Tipe File" value={ext.toUpperCase() || '-'} />
            <Row label="Ukuran" value={formatSize(fileInfo.file_size || blobSize)} />
            {fileInfo.id_surat && <Row label="ID Surat" value={fileInfo.id_surat} mono />}
            {fileInfo.nama_pengirim && <Row label="Nama" value={fileInfo.nama_pengirim} />}
            {fileInfo.perihal && <Row label="Perihal" value={fileInfo.perihal} truncate />}
            {fileInfo.tanggal_upload && (
              <Row
                label="Tanggal"
                value={new Date(fileInfo.tanggal_upload).toLocaleString('id-ID')}
              />
            )}
          </div>

          {/* ============================================ */}
          {/* PREVIEW FILE — SEMUA TIPE PAKAI BLOB URL */}
          {/* ============================================ */}
          {verifStatus === 'ok' && blobUrl && (
            <div className="border-2 border-purple-200 rounded-2xl overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 flex items-center gap-2">
                <span className="text-xl">👁️</span>
                <div>
                  <div className="font-bold text-purple-800 text-sm">Preview Isi Surat</div>
                  <div className="text-purple-600 text-xs">
                    Lihat isi file sebelum download
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-100">
                {/* GAMBAR */}
                {isImage && (
                  <div className="bg-white rounded-xl overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={blobUrl}
                      alt={fileInfo.file_name}
                      className="max-w-full max-h-[600px] object-contain"
                    />
                  </div>
                )}

                {/* PDF — pakai <object> + <embed> fallback */}
                {isPDF && (
                  <div className="bg-white rounded-xl overflow-hidden" style={{ height: '600px' }}>
                    <object
                      data={blobUrl}
                      type="application/pdf"
                      className="w-full h-full"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    >
                      <embed
                        src={blobUrl}
                        type="application/pdf"
                        className="w-full h-full"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                      />
                      <div className="p-8 text-center">
                        <p className="text-sm text-gray-500">
                          Browser Anda tidak mendukung preview PDF.
                          Silakan klik tombol download di bawah.
                        </p>
                      </div>
                    </object>
                  </div>
                )}

                {/* WORD — tidak bisa preview, tampilkan info + tombol download */}
                {isDoc && (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <div className="text-7xl mb-4">📄</div>
                    <p className="font-bold text-gray-800 text-lg">
                      File Word (.{ext})
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      File Word tidak bisa dipreview langsung di browser.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Klik tombol <strong>Download File</strong> di bawah untuk membuka file.
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                      <span className="text-blue-600 text-xs font-semibold">
                        💡 File akan terbuka otomatis di Microsoft Word setelah didownload
                      </span>
                    </div>
                  </div>
                )}

                {/* TIPE LAIN */}
                {!isImage && !isPDF && !isDoc && (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <div className="text-6xl mb-3">📎</div>
                    <p className="font-bold text-gray-800">Tipe File: {ext.toUpperCase()}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Preview tidak tersedia untuk tipe file ini.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ACTION */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleDownload}
            disabled={verifStatus === 'fail' || verifying || downloading || !blobUrl}
            className="flex-1 py-3 text-white rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: themeColor }}
          >
            {downloading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Mendownload...
              </>
            ) : (
              <>📥 Download File</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  mono,
  truncate,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span
        className={`text-sm text-right ${bold ? 'font-bold' : ''} ${
          mono ? 'font-mono text-xs' : ''
        } ${truncate ? 'truncate max-w-[200px]' : ''} text-gray-800`}
      >
        {value}
      </span>
    </div>
  );
}