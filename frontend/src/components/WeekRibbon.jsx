import { useState, useRef, useEffect } from 'react';
import {
    getWeekDays,
    addWeeks,
    formatMonthYear,
    isSameDay,
    isToday,
    getDayNameShort
} from '../utils/dateUtils';
import Icon from './Icon';

/**
 * WeekRibbon component for timetable navigation.
 *
 * Props:
 * - selectedDate: The currently selected date (for highlighting a specific day)
 * - currentDate: The reference date for the currently displayed week (controlled by parent)
 * - daysWithEvents: Array of date strings (e.g., "26. 1. 2026.") that have lessons/events
 * - onWeekChange: Called when navigating weeks (prev/next arrows) - takes (newDate, direction)
 * - onDaySelect: Called when user clicks a specific day - triggers day view
 * - onDatePickerSelect: Called when user selects a date from the expanded calendar (could be different week)
 */
export default function WeekRibbon({ selectedDate, currentDate, daysWithEvents = [], onWeekChange, onDaySelect, onDatePickerSelect }) {
    // The date to use for week display - always use parent's currentDate
    const displayDate = currentDate || new Date();

    const weekDays = getWeekDays(displayDate);

    const handlePrev = (e) => {
        e.stopPropagation();
        // Previous week - tell parent to load previous week
        const newDate = addWeeks(currentDate || new Date(), -1);
        onWeekChange(newDate, 'prev');
    };

    const handleNext = (e) => {
        e.stopPropagation();
        // Next week - tell parent to load next week
        const newDate = addWeeks(currentDate || new Date(), 1);
        onWeekChange(newDate, 'next');
    };

    // Handle date selection from the week ribbon
    const handleDaySelect = (date) => {
        onDaySelect(date);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 transition-colors">
                <button
                    onClick={handlePrev}
                    className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                >
                    <Icon name="chevronLeft" size={20} />
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-gray-900 dark:text-white select-none">
                        {formatMonthYear(displayDate)}
                    </span>
                </div>

                <button
                    onClick={handleNext}
                    className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                >
                    <Icon name="chevronRight" size={20} />
                </button>
            </div>

            {/* Content Area */}
            <div className="relative">
                {/* Week View */}
                <div className="flex justify-between px-2 pb-2 transition-all duration-300">
                    {weekDays.map((date, i) => {
                        const isSelected = isSameDay(date, selectedDate);
                        const isTodayDate = isToday(date);
                        const dateStr = `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}.`;
                        const normalizeDateStr = (str) => str.replace(/\s+/g, '').replace(/\.$/, '');
                        const hasEvents = !isSelected && daysWithEvents.some(eventDate =>
                            normalizeDateStr(eventDate) === normalizeDateStr(dateStr)
                        );

                        return (
                            <button
                                key={i}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDaySelect(date);
                                }}
                                className={`
                  flex flex-col items-center justify-center flex-1 py-3 rounded-lg mx-0.5 transition-all
                  ${isSelected
                                        ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-lg shadow-primary-600/30 dark:shadow-primary-500/40 ring-2 ring-primary-400 dark:ring-primary-300 ring-offset-1 dark:ring-offset-gray-800'
                                        : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }
                `}
                            >
                                <span className={`text-[10px] uppercase font-semibold mb-1 ${isSelected ? 'text-white/90' : ''}`}>
                                    {getDayNameShort(date)}
                                </span>
                                <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'} ${isTodayDate && !isSelected ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                                    {date.getDate()}
                                </span>
                                {hasEvents && (
                                    <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-primary-600 dark:bg-primary-400'}`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
