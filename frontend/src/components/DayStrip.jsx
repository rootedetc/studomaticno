import { useState, useRef, useEffect } from 'react';

export default function DayStrip({ days, selectedDay, onSelectDay }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (selectedDay && containerRef.current) {
      const selectedBtn = containerRef.current.querySelector(`[data-day="${selectedDay}"]`);
      if (selectedBtn) {
        selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDay]);

  if (!days || days.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="flex gap-2 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {days.map((day) => {
        const dateStr = day.lessons[0]?.date || '';
        const shortDate = dateStr.split('. ').slice(1, 3).join('.');
        
        const isSelected = selectedDay === day.day;
        
        return (
          <button
            key={day.day}
            data-day={day.day}
            onClick={() => onSelectDay(day.day)}
            className={`
              flex-shrink-0 snap-center
              flex flex-col items-center justify-center
              w-16 h-20 rounded-2xl transition-all duration-200
              border-2
              ${isSelected 
                ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/30 scale-105' 
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-primary-200 dark:hover:border-primary-800'
              }
            `}
          >
            <span className={`text-xs font-medium uppercase mb-1 ${isSelected ? 'text-primary-100' : 'text-gray-400 dark:text-gray-500'}`}>
              {day.day.substring(0, 3)}
            </span>
            <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
               {shortDate.split('.')[0] || '?'}
            </span>
            {shortDate && (
               <span className={`text-[10px] ${isSelected ? 'text-primary-100' : 'text-gray-400 dark:text-gray-500'}`}>
                 {shortDate}
               </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
