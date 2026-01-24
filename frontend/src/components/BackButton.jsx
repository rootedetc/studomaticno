import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import useTranslation from '../hooks/useTranslation';

function BackButton({ onClick, className = '' }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors ${className}`}
      aria-label={t('common.back') || 'Go back'}
    >
      <Icon name="back" className="w-5 h-5" aria-hidden="true" />
      <span>{t('common.back') || 'Natrag'}</span>
    </button>
  );
}

export default BackButton;
