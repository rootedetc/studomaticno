import { useState, useEffect, useContext, createContext } from 'react';
import useTheme from '../hooks/useTheme';
import useTranslation from '../hooks/useTranslation.jsx';

const SettingsContext = createContext();

export default function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export function SettingsProvider({ children }) {
  const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme();
  const { language, changeLanguage } = useTranslation();
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    return saved !== null ? saved === 'true' : true;
  });
  const [debugMode, setDebugMode] = useState(() => {
    const saved = localStorage.getItem('debugMode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleNotifications = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('notifications', String(newValue));
  };

  const toggleDebugMode = () => {
    const newValue = !debugMode;
    setDebugMode(newValue);
    localStorage.setItem('debugMode', String(newValue));
  };

  const clearCache = async () => {
    localStorage.clear();
    sessionStorage.clear();

    const databases = await indexedDB.databases();
    databases.forEach(db => {
      if (db.name) indexedDB.deleteDatabase(db.name);
    });

    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));

    window.location.reload();
  };

  return (
    <SettingsContext.Provider value={{
      theme,
      effectiveTheme,
      setTheme,
      toggleTheme,
      language,
      setLanguage: changeLanguage,
      notifications,
      toggleNotifications,
      debugMode,
      toggleDebugMode,
      clearCache
    }}>
      {children}
    </SettingsContext.Provider>
  );
}
