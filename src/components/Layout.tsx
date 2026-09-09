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
    { id: 'divider1', label: '', icon: '', isDivider: true },
    { id: 'surat-masuk', label: 'Surat Masuk', icon: '📨' },
    { id: 'surat-keluar', label: 'Surat Keluar', icon: '📤' },
    { id: 'kelola-warga', label: 'Kelola Warga', icon: '👥' },
    { id: 'divider2', label: '', icon: '', isDivider: true },
    ...(userRole === 'admin' ? [
      { id: 'kelola-user', label: 'Kelola User', icon: '👨‍💼' },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar Overlay Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-gradient-to-b from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] text-white transform transition-transform duration-300 ease-in-out shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm">📬</div>
              <div>
                <h1 className="font-bold text-sm">Aplikasi Surat</h1>
                <p className="text-xs text-purple-300">Kemantren Tegalrejo</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
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
                      ? 'bg-white/20 text-white font-medium shadow-lg shadow-purple-900/20 backdrop-blur-sm'
                      : 'text-purple-200 hover:bg-white/10 hover:text-white hover:translate-x-1'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                  {currentPage === item.id && <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
                </button>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-3 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-sm font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{userName}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    userRole === 'admin' ? 'bg-red-500/20 text-red-300' :
                    userRole === 'operator' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Navbar */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="font-mono text-sm text-gray-600">{clock.toLocaleTimeString('id-ID')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-gray-800">{userName}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                userRole === 'admin' ? 'bg-red-100 text-red-700' :
                userRole === 'operator' ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            </div>
            <button onClick={onLogout} className="px-3 py-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white/50 border-t border-gray-200/50 px-4 py-3 text-center">
          <p className="text-xs text-gray-500">© 2024 Aplikasi Surat - Kemantren Tegalrejo. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
