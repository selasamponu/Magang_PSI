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
    { id: 'divider1', label: '', icon: '' },
    { id: 'surat-masuk', label: 'Surat Masuk', icon: '📨' },
    { id: 'surat-keluar', label: 'Surat Keluar', icon: '📤' },
    { id: 'kelola-warga', label: 'Kelola Warga', icon: '👥' },
    { id: 'divider2', label: '', icon: '' },
    ...(userRole === 'admin' ? [
      { id: 'kelola-user', label: 'Kelola User', icon: '👨‍💼' },
      { id: 'log-aktivitas', label: 'Log Aktivitas', icon: '📋' },
    ] : []),
  ];

  const wargaMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'divider1', label: '', icon: '' },
    { id: 'kirim-surat', label: 'Kirim Surat', icon: '📝' },
    { id: 'riwayat-surat', label: 'Riwayat Surat Saya', icon: '📜' },
  ];

  const menu = isAdmin ? adminMenu : wargaMenu;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Overlay Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#1e1b4b] to-[#312e81] text-white transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📬</span>
            <div>
              <h1 className="font-bold text-sm">Aplikasi Surat</h1>
              <p className="text-xs text-purple-300">Kemantren Tegalrejo</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)]">
          {menu.map((item) => {
            if (item.id.startsWith('divider')) {
              return <hr key={item.id} className="border-white/10 my-2" />;
            }
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-all ${currentPage === item.id ? 'bg-white/20 text-white font-medium' : 'text-purple-200 hover:bg-white/10 hover:text-white'}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="font-mono">{clock.toLocaleTimeString('id-ID')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800">{userName}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${userRole === 'admin' ? 'bg-red-100 text-red-700' : userRole === 'operator' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            </div>
            <button onClick={onLogout} className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
