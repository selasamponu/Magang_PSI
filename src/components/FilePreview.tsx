import { useEffect, useState } from 'react';

interface Props {
  blobUrl: string;
  fileName: string;
  fileType?: string;
  originalUrl?: string;
}

export default function FilePreview({ blobUrl, fileName, originalUrl }: Props) {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const isPDF = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);

  const getFullUrl = () => {
    if (originalUrl) {
      if (originalUrl.startsWith('http')) return originalUrl;
      if (originalUrl.startsWith('/uploads/')) {
        // ✅ Path relatif — biarkan Vite proxy / Nginx yang meneruskan
        return originalUrl;
      }
    }
    return blobUrl;
  };

  // ============================================================
  // PDF — Kartu dengan tombol Buka & Download
  // ============================================================
  if (isPDF) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 text-center max-w-md shadow-2xl">
          <div className="w-24 h-24 mx-auto mb-5 flex items-center justify-center">
            <svg
              className="w-20 h-20 text-purple-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
              <path d="M14 2v6h6" fill="white" opacity="0.5" />
            </svg>
          </div>

          <p className="font-bold text-gray-800 text-lg leading-tight break-words px-2">
            {fileName}
          </p>

          <p className="text-sm text-gray-500 mt-3">
            Klik tombol di bawah untuk membuka PDF.
          </p>

          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={() => window.open(getFullUrl(), '_blank')}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Buka di Tab Baru
            </button>

            <button
              onClick={() => {
                fetch(getFullUrl())
                  .then((res) => res.blob())
                  .then((blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                  })
                  .catch((err) => alert('Gagal download: ' + err.message));
              }}
              className="w-full py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-6-6m6 6l6-6m2 5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Download File
            </button>
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-700">
              💡 File PDF akan dibuka di tab baru menggunakan PDF viewer bawaan browser
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // GAMBAR
  // ============================================================
  if (isImage) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <img
          src={blobUrl || getFullUrl()}
          alt={fileName}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-white"
        />
      </div>
    );
  }

  // ============================================================
  // TIPE LAIN (Word, Excel, dll — TIDAK DIDUKUNG)
  // ============================================================
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-2xl">
        <div className="text-7xl mb-4">📎</div>
        <p className="font-bold text-gray-800 text-lg break-words">{fileName}</p>
        <p className="text-sm text-gray-500 mt-2">
          Preview tidak tersedia untuk tipe file ini.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Format yang didukung: PDF, JPG, JPEG, PNG
        </p>
        <button
          onClick={() => window.open(getFullUrl(), '_blank')}
          className="mt-5 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg"
        >
          🔗 Buka di Tab Baru
        </button>
      </div>
    </div>
  );
}