import { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../App';
import useTranslation from '../hooks/useTranslation.jsx';
import Icon from './Icon';

const MobileNav = memo(function MobileNav() {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const primaryNavItems = useMemo(() => [
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
      path: '/notifications',
      label: t('nav.notifications'),
      icon: 'notifications'
    },
    {
      path: '/messages',
      label: t('nav.messages'),
      icon: 'messages'
    }
  ], [t]);

  const secondaryNavItems = useMemo(() => [
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
    },
    {
      path: '/settings',
      label: t('nav.settings'),
      icon: 'settings'
    }
  ], [t]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const handleMenuItemClick = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleLogoutClick = useCallback(() => {
    setMenuOpen(false);
    logout();
  }, [logout]);

  const toggleMenu = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  return (
    <>
      <nav 
        className="mobile-nav bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700" 
        aria-label="Mobile navigation"
      >
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `mobile-nav-item ${isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
              }`
            }
            aria-current={({ isActive }) => isActive ? 'page' : undefined}
            aria-label={item.label}
          >
            <Icon name={item.icon} aria-hidden="true" />
            <span className="mobile-nav-label">{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={toggleMenu}
          className={`mobile-nav-item ${menuOpen
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-gray-500 dark:text-gray-400'
          }`}
          aria-expanded={menuOpen}
          aria-haspopup="true"
          aria-label={t('nav.more')}
        >
          <Icon name="menu" aria-hidden="true" />
          <span className="mobile-nav-label">{t('nav.more')}</span>
        </button>
      </nav>

      {menuOpen && (
        <div 
          className="mobile-nav-overlay" 
          onClick={closeMenu}
          role="presentation"
        >
          <div 
            className="mobile-nav-menu" 
            ref={menuRef}
            role="menu"
            aria-orientation="vertical"
          >
            <div className="mobile-nav-menu-header">
              <h3 className="mobile-nav-menu-title">{t('nav.more')}</h3>
              <button
                onClick={closeMenu}
                className="mobile-nav-menu-close"
                aria-label={t('common.close')}
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mobile-nav-menu-grid">
              {secondaryNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleMenuItemClick}
                  className={({ isActive }) =>
                    `mobile-nav-menu-item ${isActive
                      ? 'active bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`
                  }
                  role="menuitem"
                >
                  <div className="mobile-nav-menu-item-icon-wrapper">
                    <Icon name={item.icon} className="w-6 h-6" />
                  </div>
                  <span className="mobile-nav-menu-item-label">{item.label}</span>
                </NavLink>
              ))}
              
              <button
                onClick={handleLogoutClick}
                className="mobile-nav-menu-item mobile-nav-menu-item-logout border-transparent hover:bg-red-50 dark:hover:bg-red-900/20"
                role="menuitem"
              >
                <div className="mobile-nav-menu-item-icon-wrapper text-red-500 dark:text-red-400">
                  <Icon name="logout" className="w-6 h-6" />
                </div>
                <span className="mobile-nav-menu-item-label text-red-600 dark:text-red-400">
                  {t('nav.logout')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default MobileNav;
