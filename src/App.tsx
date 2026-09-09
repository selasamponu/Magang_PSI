import { useState, useEffect } from 'react';
import { initDB } from './store/db';
import { getAuth, logout } from './store/auth';
import { AuthState } from './store/auth';
import { User, Warga } from './types';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardWarga from './pages/DashboardWarga';
import SuratMasukPage from './pages/SuratMasuk';
import SuratKeluarPage from './pages/SuratKeluar';
import KelolaWarga from './pages/KelolaWarga';
import KelolaUser from './pages/KelolaUser';
import LogAktivitasPage from './pages/LogAktivitas';
import KirimSurat from './pages/KirimSurat';
import RiwayatSurat from './pages/RiwayatSurat';

// Initialize database
initDB();

export default function App() {
  const [auth, setAuthState] = useState<AuthState>(getAuth());
  const [page, setPage] = useState('login');
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    if (auth.isLoggedIn) {
      setPage('app');
      setCurrentPage('dashboard');
    } else {
      setPage('login');
    }
  }, [auth.isLoggedIn]);

  const handleLoginSuccess = () => {
    setAuthState(getAuth());
  };

  const handleLogout = () => {
    logout();
    setAuthState({ isLoggedIn: false, user: null, userType: null, token: null });
    setPage('login');
  };

  const handleNavigate = (p: string) => {
    setCurrentPage(p);
  };

  // Render based on page state
  if (page === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} onGoRegister={() => setPage('register')} />;
  }

  if (page === 'register') {
    return <Register onRegisterSuccess={() => setPage('login')} onGoLogin={() => setPage('login')} />;
  }

  // Main App
  if (!auth.isLoggedIn || !auth.user) return null;

  const isAdmin = auth.userType === 'user';
  const currentUser = auth.user as User;
  const currentWarga = auth.user as Warga;

  const renderPage = () => {
    if (isAdmin) {
      switch (currentPage) {
        case 'dashboard': return <DashboardAdmin />;
        case 'surat-masuk': return <SuratMasukPage currentUser={currentUser} />;
        case 'surat-keluar': return <SuratKeluarPage currentUser={currentUser} />;
        case 'kelola-warga': return <KelolaWarga currentUser={currentUser} />;
        case 'kelola-user': return currentUser.role === 'admin' ? <KelolaUser currentUser={currentUser} /> : <DashboardAdmin />;
        case 'log-aktivitas': return currentUser.role === 'admin' ? <LogAktivitasPage /> : <DashboardAdmin />;
        default: return <DashboardAdmin />;
      }
    } else {
      switch (currentPage) {
        case 'dashboard': return <DashboardWarga warga={currentWarga} />;
        case 'kirim-surat': return <KirimSurat warga={currentWarga} onNavigate={handleNavigate} />;
        case 'riwayat-surat': return <RiwayatSurat warga={currentWarga} />;
        default: return <DashboardWarga warga={currentWarga} />;
      }
    }
  };

  return (
    <Layout auth={auth} currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  );
}
