import { useState, useEffect } from 'react';
import { AuthState } from '../store/auth';
import { User, Warga } from '../types';

interface LayoutProps {
  auth: AuthState;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function Layout({ auth, currentPage, onNavigate, onLogout, children }: LayoutProps) {
  const [clock, setClock] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [appSettings, setAppSettings] = useState({
    nama_aplikasi: 'Aplikasi Surat',
    nama_instansi: 'Kemantren Tegalrejo',
    logo_url: '/logo.png',
    warna_tema: '#8B3A1A',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { SettingsDB } = await import('../store/db');
        const data = await SettingsDB.get();
        if (data) {
          setAppSettings({
            nama_aplikasi: data.nama_aplikasi || 'Aplikasi Surat',
            nama_instansi: data.nama_instansi || 'Kemantren Tegalrejo',
            logo_url: data.logo_url || '/logo.png',
            warna_tema: data.warna_tema || '#8B3A1A',
          });
        }
      } catch (err) {
        console.error('Error loading app settings:', err);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin = auth.userType === 'user';
  const user = auth.user as User | Warga;
  const userName = isAdmin ? (user as User).nama : (user as Warga).nama_lengkap;
  const userRole = isAdmin ? (user as User).role : 'warga';

  const adminMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'divider1', label: '', icon: '', isDivider: true },
    { id: 'surat-masuk', label: 'Surat Masuk', icon: '📨' },
    { id: 'surat-keluar', label: 'Surat Keluar', icon: '📤' },
    { id: 'kelola-warga', label: 'Kelola Warga', icon: '👥' },
    { id: 'laporan', label: 'Laporan', icon: '📈' },
    { id: 'divider2', label: '', icon: '', isDivider: true },
    ...(userRole === 'admin' ? [
      { id: 'kelola-user', label: 'Kelola User', icon: '👨‍💼' },
      { id: 'kelola-aplikasi', label: 'Pengaturan Aplikasi', icon: '⚙️' },
      { id: 'log-aktivitas', label: 'Log Aktivitas', icon: '📋' },
    ] : []),
  ];

  const wargaMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'divider1', label: '', icon: '', isDivider: true },
    { id: 'kirim-surat', label: 'Kirim Surat', icon: '📝' },
    { id: 'riwayat-surat', label: 'Riwayat Surat Saya', icon: '📜' },
  ];

  const menu = isAdmin ? adminMenu : wargaMenu;

  const logoUrl = appSettings.logo_url.startsWith('/uploads/')
    ? `http://${window.location.hostname}:5000${appSettings.logo_url}`
    : appSettings.logo_url;

  return (
    /* Background BODY — Kuning Soft (sama seperti Login) */
    <div className="min-h-screen flex bg-gradient-to-br from-yellow-200 via-amber-100 to-yellow-300 relative overflow-hidden">
      {/* Orb dekoratif kuning */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-amber-300/40 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-yellow-300/40 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-200/50 rounded-full blur-3xl pointer-events-none" />

      {/* Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-amber-500/40 rounded-full"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 13) % 100}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ============================================================ */}
      {/* ✅ SIDEBAR HITAM ELEGAN                                       */}
      {/* ============================================================ */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 text-white transform transition-transform duration-300 ease-in-out shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{
          background: `linear-gradient(180deg, #000000 0%, #0a0a0a 40%, #111111 70%, #1a1a1a 100%)`
        }}
      >
        <div className="flex flex-col h-full">
          {/* LOGO */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt="Logo"
                className="w-12 h-12 object-contain flex-shrink-0"
                style={{ background: 'transparent', border: 'none', padding: 0 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
              <div className="min-w-0">
                <h1 className="font-bold text-sm leading-tight truncate">{appSettings.nama_aplikasi}</h1>
                <p className="text-xs text-amber-300 leading-tight truncate">{appSettings.nama_instansi}</p>
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menu.map((item) => {
              if (item.isDivider) {
                return <hr key={item.id} className="border-white/10 my-3" />;
              }
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-3 transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/30'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                  {currentPage === item.id && <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
                </button>
              );
            })}
          </nav>

          {/* USER INFO */}
          <div className="p-3 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-xl shadow-lg flex-shrink-0">
                  {userRole === 'admin' ? '👨‍💼' : userRole === 'operator' ? '🧑‍💼' : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-1.5 text-white">
                    <span className="text-base">
                      {userRole === 'admin' ? '👨‍💼' : userRole === 'operator' ? '🧑‍💼' : '👤'}
                    </span>
                    <span className="truncate">{userName}</span>
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    userRole === 'admin' ? 'bg-red-500/30 text-red-200' :
                    userRole === 'operator' ? 'bg-blue-500/30 text-blue-200' :
                    'bg-green-500/30 text-green-200'
                  }`}>
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 relative z-10">
        <header className="bg-white/70 backdrop-blur-xl shadow-sm border-b border-amber-200/50 px-4 py-3 flex items-center justify-between sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-amber-100 transition-colors">
              <svg className="w-5 h-5 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-amber-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold text-amber-800">
                  {clock.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                <span className="font-mono text-sm text-amber-700 font-bold">
                  {clock.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-amber-900 flex items-center gap-1.5 justify-end">
                <span className="text-base">
                  {userRole === 'admin' ? '👨‍💼' : userRole === 'operator' ? '🧑‍💼' : '👤'}
                </span>
                <span>{userName}</span>
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                userRole === 'admin' ? 'bg-red-100 text-red-700' :
                userRole === 'operator' ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            </div>
            <button onClick={onLogout} className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto print:p-0">
          {children}
        </main>

        <footer className="bg-white/50 backdrop-blur-sm border-t border-amber-200/50 px-4 py-3 text-center print:hidden">
          <p className="text-xs text-amber-800">
            © 2026 <span className="font-semibold">{appSettings.nama_aplikasi} - {appSettings.nama_instansi}</span>
          </p>
        </footer>
      </div>
    </div>
  );
}