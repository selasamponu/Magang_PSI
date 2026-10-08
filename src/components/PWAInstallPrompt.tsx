import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Cek apakah sudah terinstall (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Cek iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Cek apakah user sudah pernah dismiss
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Event untuk Android/Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Tampilkan prompt setelah 3 detik (kecuali sudah di-dismiss < 7 hari)
      if (daysSinceDismissed > 7 && !standalone) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Untuk iOS, tampilkan prompt manual (iOS tidak support beforeinstallprompt)
    if (iOS && !standalone && daysSinceDismissed > 7) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    // Deteksi saat app berhasil diinstall
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Untuk iOS, tampilkan instruksi manual
      if (isIOS) {
        alert(
          'Untuk install di iPhone/iPad:\n\n' +
          '1. Tap tombol "Share" (kotak dengan panah ke atas) di Safari\n' +
          '2. Scroll ke bawah dan pilih "Add to Home Screen"\n' +
          '3. Tap "Add"\n\n' +
          'Aplikasi akan muncul di home screen Anda!'
        );
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install');
    } else {
      console.log('[PWA] User dismissed install');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Jangan tampilkan kalau sudah standalone atau prompt tidak perlu
  if (isStandalone || !showPrompt) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        maxWidth: '420px',
        margin: '0 auto',
        background: 'linear-gradient(135deg, #7C2D12, #8B3A1A)',
        color: 'white',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        zIndex: 9999,
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        animation: 'slideUp 0.4s ease-out',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div
        style={{
          width: '48px',
          height: '48px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Download size={24} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>
          Install Aplikasi Surat
        </div>
        <div style={{ fontSize: '12px', opacity: 0.85 }}>
          {isIOS
            ? 'Tap Share → Add to Home Screen'
            : 'Tambahkan ke home screen untuk akses cepat'}
        </div>
      </div>

      <button
        onClick={handleInstall}
        style={{
          background: 'white',
          color: '#7C2D12',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Install
      </button>

      <button
        onClick={handleDismiss}
        aria-label="Tutup"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          opacity: 0.7,
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}