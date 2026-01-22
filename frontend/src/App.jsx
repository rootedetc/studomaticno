import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import api from './services/api';
import { clearAllDailyCache } from './utils/cache';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Files from './pages/Files';
import Grades from './pages/Grades';
import Finance from './pages/Finance';
import Ispiti from './pages/Ispiti';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import DebugPanel from './components/DebugPanel';
import SessionExpiredModal from './components/SessionExpiredModal';
import { SettingsProvider } from './contexts/SettingsContext';
import { TranslationProvider } from './hooks/useTranslation.jsx';

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    checkAuth();
    setIsMobile(window.innerWidth < 1024);
    api.setAuthErrorHandler(() => setSessionExpired(true));

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkAuth = async () => {
    try {
      const data = await api.checkAuth();
      if (data.authenticated) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const data = await api.login(username, password);
    setUser(data.user);
    setSessionExpired(false);
    return data;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setSessionExpired(false);
    clearAllDailyCache();
    document.cookie = 'studomaticno_remember=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  };

  const value = { user, login, logout, loading, sessionExpired, setSessionExpired };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      <TranslationProvider>
        <SettingsProvider>
          {!user ? (
            <Routes>
              <Route path="*" element={<Login />} />
            </Routes>
          ) : isMobile ? (
            <div>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/timetable" element={<Timetable />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/files" element={<Files />} />
                <Route path="/grades" element={<Grades />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/ispiti" element={<Ispiti />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <MobileNav />
            </div>
          ) : (
            <div className="sidebar-layout">
              <aside className="sidebar bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <Sidebar />
              </aside>
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/timetable" element={<Timetable />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/files" element={<Files />} />
                  <Route path="/grades" element={<Grades />} />
                  <Route path="/finance" element={<Finance />} />
                  <Route path="/ispiti" element={<Ispiti />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          )}
          <DebugPanel />
          <SessionExpiredModal
            isOpen={sessionExpired}
            onClose={() => setSessionExpired(false)}
          />
        </SettingsProvider>
      </TranslationProvider>
    </AuthContext.Provider>
  );
}

export default App;
