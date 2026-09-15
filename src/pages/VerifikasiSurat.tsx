import { useState, useEffect } from 'react';
import { SuratKeluarDB } from '../store/db';
import { SuratKeluar } from '../types';
import { downloadFile } from '../utils/downloadFile';

interface Props {
  idSurat: string;
  onBack: () => void;
}

export default function VerifikasiSurat({ idSurat, onBack }: Props) {
  const [surat, setSurat] = useState<SuratKeluar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSurat = async () => {
      try {
        setLoading(true);
        const data = await SuratKeluarDB.getById(idSurat);
        if (!data) {
          setError('Surat tidak ditemukan di database!');
        } else {
          setSurat(data);
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat surat');
      } finally {
        setLoading(false);
      }
    };
    loadSurat();
  }, [idSurat]);

  // === LOADING ===
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[#8B3A1A] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data surat...</p>
        </div>
      </div>
    );
  }

  // === ERROR / TIDAK DITEMUKAN ===
  if (error || !surat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-7xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">SURAT TIDAK VALID</h1>
          <p className="text-gray-600 mb-2">Surat dengan ID berikut tidak ditemukan:</p>
          <p className="font-mono text-sm bg-red-50 text-red-700 p-3 rounded-xl mb-4 break-all">
            {idSurat}
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6 text-left">
            <p className="text-xs text-yellow-800">
              ⚠️ <strong>Perhatian:</strong> Surat ini kemungkinan <strong>PALSU</strong> atau belum terdaftar.
            </p>
          </div>
          <button
            onClick={onBack}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // === SURAT VALID ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-4 rounded-3xl bg-white shadow-xl p-3 border-2 border-amber-100">
            <img src="/logo.png" alt="Logo Kemantren" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verifikasi Surat</h1>
          <p className="text-gray-600 mt-1">Kemantren Tegalrejo Yogyakarta</p>
        </div>

        {/* Kartu Surat */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header Hijau */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white text-center">
            <div className="text-5xl mb-2">✅</div>
            <h2 className="text-xl font-bold">SURAT ASLI TERVERIFIKASI</h2>
            <p className="text-sm text-white/90 mt-1">Surat ini terdaftar resmi di sistem</p>
          </div>

          {/* Isi Surat */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Surat</p>
                <p className="font-mono text-sm font-bold text-[#8B3A1A] mt-1 break-all">
                  {surat.id_surat_keluar}
                </p>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                <p className="text-sm font-bold text-green-700 mt-1 capitalize">{surat.status}</p>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nomor Surat</p>
                <p className="font-mono text-sm font-bold text-gray-800 mt-1">{surat.nomor_surat}</p>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</p>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  {new Date(surat.tanggal_kirim).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 sm:col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Penerima</p>
                <p className="text-sm font-bold text-gray-800 mt-1">{surat.nama_penerima}</p>
                <p className="text-xs text-gray-500 font-mono">NIK: {surat.nik_penerima}</p>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 sm:col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Perihal</p>
                <p className="text-sm font-bold text-gray-800 mt-1">{surat.perihal}</p>
              </div>
            </div>

            {/* Tombol Download */}
            {surat.file_url && (
              <button
                onClick={() => downloadFile(surat.file_url, surat.file_name, surat.file_type)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#8B3A1A] to-[#A0522D] text-white rounded-xl font-semibold hover:opacity-90 transition-all"
              >
                📄 Download File Surat
              </button>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-700">
                ℹ️ Surat ini diverifikasi oleh sistem Aplikasi Surat Kemantren Tegalrejo.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          © 2026 Kemantren Tegalrejo Yogyakarta
        </p>
      </div>
    </div>
  );
}