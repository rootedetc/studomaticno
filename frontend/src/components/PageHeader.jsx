import { useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import useTranslation from '../hooks/useTranslation';

function PageHeader({
  title,
  subtitle,
  showBackButton = false,
  breadcrumbs,
  actions,
  onBack
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const mobileBreadcrumbRef = useRef(null);

  useLayoutEffect(() => {
    if (mobileBreadcrumbRef.current) {
      mobileBreadcrumbRef.current.scrollLeft = mobileBreadcrumbRef.current.scrollWidth;
    }
  }, [breadcrumbs]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 transition-colors duration-200">
      <div className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors shrink-0"
                aria-label={t('common.back') || 'Go back'}
              >
                <Icon name="back" className="w-5 h-5" aria-hidden="true" />
                <span className="hidden sm:inline text-sm font-medium">{t('common.back') || 'Natrag'}</span>
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 hidden md:block truncate">
                  {subtitle}
                </p>
              )}
              {breadcrumbs && breadcrumbs.length > 0 && (

                <nav
                  ref={mobileBreadcrumbRef}
                  className="flex items-center gap-1 mt-1 md:hidden overflow-x-auto whitespace-nowrap no-scrollbar -mx-4 px-4"
                  aria-label="Breadcrumb"
                >
                  <ol className="flex items-center gap-1 min-w-max">
                    {breadcrumbs.map((crumb, index) => {
                      const isLast = index === breadcrumbs.length - 1;
                      return (
                        <li key={index} className="flex items-center gap-1">
                          {index > 0 && (
                            <Icon name="chevronRight" className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                          )}
                          {isLast ? (
                            <span className="text-sm text-gray-900 dark:text-white font-medium truncate" aria-current="page">
                              {crumb.label}
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (crumb.onClick) {
                                  crumb.onClick();
                                } else if (crumb.path) {
                                  navigate(crumb.path);
                                }
                              }}
                              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors truncate"
                            >
                              {crumb.label}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </nav>
              )}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="hidden md:flex items-center gap-1 mt-1" aria-label="Breadcrumb">
                  <ol className="flex items-center gap-1">
                    {breadcrumbs.map((crumb, index) => {
                      const isLast = index === breadcrumbs.length - 1;
                      return (
                        <li key={index} className="flex items-center gap-1">
                          {index > 0 && (
                            <Icon name="chevronRight" className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                          )}
                          {isLast ? (
                            <span className="text-sm text-gray-900 dark:text-white font-medium truncate" aria-current="page">
                              {crumb.label}
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (crumb.onClick) {
                                  crumb.onClick();
                                } else if (crumb.path) {
                                  navigate(crumb.path);
                                }
                              }}
                              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors truncate"
                            >
                              {crumb.label}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </nav>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default PageHeader;
