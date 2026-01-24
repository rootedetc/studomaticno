import { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';

const SegmentedControl = memo(function SegmentedControl({
  options = [],
  value,
  onChange,
  className = '',
  ariaLabel
}) {
  const containerRef = useRef(null);

  const enabledOptions = useMemo(() => options.filter(o => !o.disabled), [options]);

  const handleChange = useCallback((optionValue) => {
    if (onChange) {
      onChange(optionValue);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e, option) => {
    const currentIndex = enabledOptions.findIndex(o => o.value === value);

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % enabledOptions.length;
      handleChange(enabledOptions[nextIndex].value);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + enabledOptions.length) % enabledOptions.length;
      handleChange(enabledOptions[prevIndex].value);
    }
  }, [enabledOptions, value, handleChange]);

  return (
    <div
      className={`inline-flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-full transition-colors duration-200 ${className}`}
      role="tablist"
      aria-label={ariaLabel || 'Segmented control'}
      ref={containerRef}
    >
      {options.map((option, index) => {
        const isActive = value === option.value;
        const isDisabled = option.disabled;
        return (
          <button
            key={option.value}
            onClick={() => !isDisabled && handleChange(option.value)}
            onKeyDown={(e) => !isDisabled && handleKeyDown(e, option)}
            className={`
              relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isActive
                ? 'text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
            role="tab"
            aria-selected={isActive}
            aria-disabled={isDisabled || undefined}
            aria-controls={`segment-${option.value}`}
            tabIndex={isActive ? 0 : -1}
            disabled={isDisabled}
          >
            {isActive && (
              <span className="absolute inset-0 bg-primary-600 dark:bg-primary-500 rounded-full transition-transform duration-200" />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
});

export default SegmentedControl;
