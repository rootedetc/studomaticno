import Icon from './Icon';

function EmptyState({ icon = 'emptyInbox', title, subtitle, actionLabel, onAction, className = '' }) {
  return (
    <div className={`card text-center py-12 flex flex-col items-center justify-center ${className}`}>
      <div className="w-24 h-24 mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center ring-8 ring-gray-50/50 dark:ring-gray-800/30">
        <Icon name={icon} className="w-10 h-10 text-gray-400 dark:text-gray-500 opacity-80" />
      </div>
      {title && (
        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</p>
      )}
      {subtitle && (
        <p className="text-gray-500 dark:text-gray-400 mb-4">{subtitle}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
