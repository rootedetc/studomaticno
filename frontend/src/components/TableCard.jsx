import { useState, memo, useMemo } from 'react';

const TableCard = memo(function TableCard({
  data,
  columns,
  onClick,
  expandableContent,
  defaultExpanded = false,
  className = '',
  ariaLabel
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (expandableContent) {
        setIsExpanded(!isExpanded);
      }
      onClick?.(data);
    }
  };

  const handleClick = () => {
    if (expandableContent) {
      setIsExpanded(!isExpanded);
    }
    onClick?.(data);
  };

  const columnGroups = useMemo(() => ({
    high: columns.filter(c => c.priority === 'high'),
    medium: columns.filter(c => c.priority === 'medium'),
    low: columns.filter(c => c.priority === 'low')
  }), [columns]);

  const contentId = useMemo(() => 
    `tablecard-${data.id || data.key || Math.random().toString(36).substr(2, 9)}`,
    [data.id, data.key]
  );

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`card card-hover transition-all duration-200 fade-in ${
        onClick || expandableContent ? 'cursor-pointer' : ''
      } ${className}`}
      role={onClick || expandableContent ? 'button' : undefined}
      tabIndex={onClick || expandableContent ? 0 : undefined}
      aria-expanded={expandableContent ? isExpanded : undefined}
      aria-label={ariaLabel || (expandableContent ? (isExpanded ? 'Expanded details' : 'Collapsed details') : undefined)}
      aria-controls={expandableContent ? contentId : undefined}
    >
      <div id={contentId} className="md:hidden">
        <div className="space-y-3">
          {columnGroups.high.map(column => (
            <div key={column.key} className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {column.label}
              </span>
              <span className="font-medium text-gray-900 dark:text-white text-right">
                {column.format ? column.format(data[column.key], data) : data[column.key]}
              </span>
            </div>
          ))}

          {columnGroups.medium.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-2">
              {columnGroups.medium.map(column => (
                <div key={column.key} className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {column.label}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white text-right max-w-[60%] truncate">
                    {column.format ? column.format(data[column.key], data) : data[column.key]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {columnGroups.low.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
              <div className="grid grid-cols-2 gap-2">
                {columnGroups.low.map(column => (
                  <div key={column.key} className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                      {column.label}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {column.format ? column.format(data[column.key], data) : data[column.key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {expandableContent && (
          <>
            <div
              className={`transition-all duration-200 ease-in-out overflow-hidden ${
                isExpanded ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                {expandableContent(data)}
              </div>
            </div>
            <div className="flex items-center justify-center mt-2">
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </>
        )}
      </div>

      <div className="hidden md:table-row">
        {columns.map(column => (
          <td
            key={column.key}
            className="table-cell"
          >
            {column.format ? column.format(data[column.key], data) : data[column.key]}
          </td>
        ))}
      </div>
    </div>
  );
});

export default TableCard;
