import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import api from './services/api';
import { clearAllDailyCache, getStickyAnnouncementsCache, setStickyAnnouncementsCache } from './utils/cache';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import Inbox from './pages/Inbox';
import Files from './pages/Files';
import Grades from './pages/Grades';
import Finance from './pages/Finance';
import Ispiti from './pages/Ispiti';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import DebugPanel from './components/DebugPanel';
import SessionExpiredModal from './components/SessionExpiredModal';
import ErrorBoundary from './components/ErrorBoundary';
import PWAInstallBanner from './components/PWAInstallBanner';
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
  const [stickyAnnouncements, setStickyAnnouncements] = useState([]);

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
        const cachedSticky = getStickyAnnouncementsCache();
        if (cachedSticky) {
          setStickyAnnouncements(cachedSticky);
        }
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

    try {
      const stickyData = await api.getStickyAnnouncements();
      const announcements = stickyData.stickyAnnouncements || [];
      setStickyAnnouncements(announcements);
      setStickyAnnouncementsCache(announcements);
    } catch (err) {
      console.error('Failed to load sticky announcements:', err);
    }

    return data;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setSessionExpired(false);
    setStickyAnnouncements([]);
    clearAllDailyCache();
    document.cookie = 'studomaticno_remember=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  };

  const value = { user, login, logout, loading, sessionExpired, setSessionExpired, stickyAnnouncements, setStickyAnnouncements };

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
              <a href="#main-content" className="skip-link">Skip to main content</a>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/timetable" element={<Timetable />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/files" element={<Files />} />
                  <Route path="/grades" element={<Grades />} />
                  <Route path="/finance" element={<Finance />} />
                  <Route path="/ispiti" element={<Ispiti />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
              <MobileNav />
            </div>
          ) : (
            <div className="sidebar-layout">
              <a href="#main-content" className="skip-link">Skip to main content</a>
              <aside className="sidebar bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <Sidebar />
              </aside>
              <main className="main-content" id="main-content">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/timetable" element={<Timetable />} />
                    <Route path="/inbox" element={<Inbox />} />
                    <Route path="/files" element={<Files />} />
                    <Route path="/grades" element={<Grades />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/ispiti" element={<Ispiti />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </ErrorBoundary>
              </main>
            </div>
          )}
          {import.meta.env.DEV && <DebugPanel />}
          {user && <PWAInstallBanner />}
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
