import { useNavigate } from 'react-router-dom';
import useSettings from '../contexts/SettingsContext';
import useTranslation from '../hooks/useTranslation.jsx';

export default function Settings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, setTheme, language, setLanguage, notifications, toggleNotifications, debugMode, toggleDebugMode, clearCache } = useSettings();

  const testNotification = async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Libertas PWA', {
          body: t('settings.testNotification'),
          icon: '/icon-192.png'
        });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification('Libertas PWA', {
            body: t('settings.testNotification'),
            icon: '/icon-192.png'
          });
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('settings.appearance')}</h2>
          <div className="grid grid-cols-3 gap-3">
            {['light', 'dark', 'system'].map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  theme === themeOption
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {t(`settings.theme.${themeOption}`)}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('settings.language')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {['en', 'hr'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  language === lang
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {t(`settings.lang.${lang === 'en' ? 'english' : 'croatian'}`)}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('settings.notifications')}</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-300">{t('settings.enableNotifications')}</span>
              <button
                onClick={toggleNotifications}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notifications ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
            <button
              onClick={testNotification}
              className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              {t('settings.testNotification')}
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('settings.data')}</h2>
          <button
            onClick={() => {
              if (confirm('Are you sure?')) {
                clearCache();
              }
            }}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t('settings.clearCache')}
          </button>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('settings.debugging')}</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700 dark:text-gray-300">{t('settings.enableDebugMode')}</span>
            <button
              onClick={toggleDebugMode}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                debugMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  debugMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('settings.about')}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('settings.version')} 1.0.0
          </p>
        </section>
      </main>
    </div>
  );
}
