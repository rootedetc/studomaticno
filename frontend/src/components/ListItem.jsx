import { memo, useState } from 'react';
import Icon from './Icon';

const ListItem = memo(function ListItem({
  icon,
  title,
  subtitle,
  date,
  isNew = false,
  hasAttachment = false,
  badge,
  onClick,
  className = '',
  ariaLabel,
  isExpanded = false
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseLeave={() => setIsPressed(false)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`card cursor-pointer transition-all touch-target ${isExpanded ? '!rounded-b-none !border-b-0 !shadow-none bg-gray-50 dark:bg-gray-800' : 'card-hover'
        } ${isNew ? 'bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
        } ${isPressed ? 'scale-[0.98]' : ''} ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={ariaLabel || `${title}${subtitle ? `, ${subtitle}` : ''}${isNew ? ', new' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isNew ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'
          }`}>
          <Icon
            name={icon}
            className={`w-5 h-5 ${isNew ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isNew && (
              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" aria-label="New" />
            )}
            <h3 className={`font-semibold ${isNew ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              {title}
            </h3>
            {hasAttachment && (
              <Icon name="attachment" className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" aria-hidden="true" />
            )}
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
          )}
          {date && (
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-500">
              <span>{date}</span>
            </div>
          )}
        </div>
        <Icon name="chevronRight" className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
});

export default ListItem;
