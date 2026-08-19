import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import { TranslationProvider } from './hooks/useTranslation';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Handle service worker updates
  let refreshing = false;

  const checkForUpdates = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    } catch (error) {
      console.log('ServiceWorker update check failed:', error);
    }
  };

  // Listen for the "controllerchange" event which fires when the service worker 
  // has updated and claimed the clients (due to clientsClaim: true in vite config)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then(() => {
        checkForUpdates();
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed:', error);
      });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdates();
    }
  });

  window.addEventListener('focus', checkForUpdates);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <TranslationProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </TranslationProvider>
    </BrowserRouter>
  </StrictMode>
);
