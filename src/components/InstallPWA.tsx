import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [appName, setAppName] = useState('Aplikasi Surat');
  const [appInstansi, setAppInstansi] = useState('Kemantren Tegalrejo');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { SettingsDB } = await import('../store/db');
        const data = await SettingsDB.get();
        if (data) {
          if (data.logo_url) {
            setLogoUrl(
              data.logo_url.startsWith('/uploads/')
                ? `http://${window.location.hostname}:5000${data.logo_url}`
                : data.logo_url
            );
          }
          if (data.nama_aplikasi) setAppName(data.nama_aplikasi);
          if (data.nama_instansi) setAppInstansi(data.nama_instansi);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isIOSStandalone = (navigator as any).standalone === true;

    setIsIOS(isIOSDevice);

    if (standalone || isIOSStandalone) {
      setIsInstalled(true);
      return;
    }

    const dismissed = localStorage.getItem('pwa-dismissed');
    if (dismissed === 'true') {
      const dismissedTime = parseInt(localStorage.getItem('pwa-dismissed-time') || '0');
      const daysSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (isIOSDevice && !isIOSStandalone) {
      setTimeout(() => setShowBanner(true), 3000);
    }

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      console.log('✅ PWA berhasil di-install');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      alert('Browser kamu tidak mendukung install otomatis.\n\nSilakan:\n1. Buka menu browser (⋮)\n2. Pilih "Add to Home screen" atau "Install app"');
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      console.log('✅ User menerima install');
      setShowBanner(false);
    } else {
      console.log('❌ User menolak install');
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-dismissed', 'true');
    localStorage.setItem('pwa-dismissed-time', Date.now().toString());
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-[200] animate-in">
        <div className="bg-gradient-to-br from-[#8B3A1A] to-[#A0522D] text-white rounded-2xl shadow-2xl p-4 border border-white/20">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Install {appName}</p>
              <p className="text-xs text-white/80 mt-1">
                Pasang aplikasi di HP kamu biar lebih cepat & mudah diakses
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 px-4 py-2 bg-white text-[#8B3A1A] rounded-xl text-xs font-bold hover:bg-amber-50 transition-all"
                >
                  📲 Install Sekarang
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 bg-white/20 text-white rounded-xl text-xs font-semibold hover:bg-white/30 transition-all"
                >
                  Nanti
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">📱</div>
              <h3 className="text-lg font-bold text-gray-800">Cara Install di iPhone</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex gap-3">
                <span className="font-bold text-[#8B3A1A] flex-shrink-0">1.</span>
                <p>Tap tombol <strong>Share</strong> <span className="text-lg">⬆️</span> di bawah browser Safari</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-[#8B3A1A] flex-shrink-0">2.</span>
                <p>Scroll ke bawah, tap <strong>"Add to Home Screen"</strong> <span className="text-lg">➕</span></p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-[#8B3A1A] flex-shrink-0">3.</span>
                <p>Tap <strong>"Add"</strong> di kanan atas</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-[#8B3A1A] flex-shrink-0">4.</span>
                <p>Aplikasi akan muncul di Home Screen HP kamu! 🎉</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowIOSGuide(false);
                handleDismiss();
              }}
              className="w-full mt-5 py-3 bg-gradient-to-r from-[#8B3A1A] to-[#A0522D] text-white rounded-xl font-semibold"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}