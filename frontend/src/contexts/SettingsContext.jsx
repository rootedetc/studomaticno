import { useState, useEffect, useContext, createContext, useCallback, useMemo } from 'react';
import useTheme from '../hooks/useTheme';
import useTranslation from '../hooks/useTranslation.jsx';
import { useOptimisticUpdate } from '../hooks/useOptimisticUpdate';

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

  const toggleNotificationsOptimistic = useCallback(() => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('notifications', String(newValue));
    return newValue;
  }, [notifications]);

  const toggleDebugModeOptimistic = useCallback(() => {
    const newValue = !debugMode;
    setDebugMode(newValue);
    localStorage.setItem('debugMode', String(newValue));
    return newValue;
  }, [debugMode]);

  const notificationsUpdate = useOptimisticUpdate(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true };
  });

  const debugModeUpdate = useOptimisticUpdate(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true };
  });

  const toggleNotifications = useCallback(async () => {
    const optimisticValue = toggleNotificationsOptimistic();
    try {
      await notificationsUpdate.execute(optimisticValue);
    } catch (err) {
    }
  }, [toggleNotificationsOptimistic, notificationsUpdate]);

  const toggleDebugMode = useCallback(async () => {
    const optimisticValue = toggleDebugModeOptimistic();
    try {
      await debugModeUpdate.execute(optimisticValue);
    } catch (err) {
    }
  }, [toggleDebugModeOptimistic, debugModeUpdate]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const clearCache = useCallback(async () => {
    localStorage.clear();
    sessionStorage.clear();

    const databases = await indexedDB.databases();
    databases.forEach(db => {
      if (db.name) indexedDB.deleteDatabase(db.name);
    });

    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));

    window.location.reload();
  }, []);

  const value = useMemo(() => ({
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
  }), [
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
    language,
    changeLanguage,
    notifications,
    toggleNotifications,
    debugMode,
    toggleDebugMode,
    clearCache
  ]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
