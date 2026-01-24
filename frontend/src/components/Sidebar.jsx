import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import useTranslation from '../hooks/useTranslation.jsx';
import Icon from './Icon';
import { memo, useMemo, useCallback } from 'react';

const Sidebar = memo(function Sidebar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const navItems = useMemo(() => [
    {
      path: '/',
      label: t('nav.dashboard'),
      icon: 'dashboard'
    },
    {
      path: '/timetable',
      label: t('nav.timetable'),
      icon: 'timetable'
    },
    {
      path: '/inbox',
      label: t('nav.inbox'),
      icon: 'inbox'
    },
    {
      path: '/files',
      label: t('nav.files'),
      icon: 'files'
    },
    {
      path: '/grades',
      label: t('nav.grades'),
      icon: 'grades'
    },
    {
      path: '/finance',
      label: t('nav.finance'),
      icon: 'finance'
    },
    {
      path: '/ispiti',
      label: t('nav.exams'),
      icon: 'exams'
    }
  ], [t]);

  const handleSettingsClick = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const userInitial = useMemo(() => {
    return user?.username?.charAt(0)?.toUpperCase() || 'U';
  }, [user?.username]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">studomaticno</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Eduneta Dashboard</p>
      </div>

      <nav className="flex-1 p-4" aria-label="Main navigation">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:pl-5'
                  }`
                }
                style={{ transition: 'all 0.2s ease' }}
                aria-current={({ isActive }) => isActive ? 'page' : undefined}
              >
                <Icon name={item.icon} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSettingsClick}
          className="flex items-center gap-3 px-4 py-3 mb-2 text-left rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-full"
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 icon-bg-blue">
            <span className="text-primary-700 dark:text-primary-400 font-medium leading-none text-xs">
              {userInitial}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">{user?.username}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Prijavljen</p>
          </div>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:text-white rounded-lg transition-colors w-full"
          aria-label={t('nav.logout')}
        >
          <Icon name="logout" aria-hidden="true" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );
});

export default Sidebar;
