import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { getFriendlyErrorMessage } from '../utils/helpers';
import { formatFullDate, getWeekDays, addWeeks } from '../utils/dateUtils';
import { SkeletonCard } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import WeekRibbon from '../components/WeekRibbon';
import AddToCalendar from '../components/AddToCalendar';
import Icon from '../components/Icon';

function Timetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  // null = show all days, Date = show only that day (filter locally)
  const [selectedDate, setSelectedDate] = useState(null);
  const [error, setError] = useState('');
  const [weekInfo, setWeekInfo] = useState({ weekStart: '', weekEnd: '' });
  // Track the current week's reference date for ribbon display
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  // Track which lesson has calendar popup open (by key)
  const [calendarOpenFor, setCalendarOpenFor] = useState(null);

  // Ref to track the latest request timestamp to handle race conditions
  const lastRequestTimeRef = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDebugMode(params.get('debug') === 'true');

    // Initial load - load the current week from the server
    loadInitialTimetable();
  }, []);

  // Load initial timetable (current week from server's perspective)
  const loadInitialTimetable = async () => {
    const requestTime = Date.now();
    lastRequestTimeRef.current = requestTime;

    setLoading(true);
    try {
      const result = await api.getTimetable();

      // Only update if this is the latest request
      if (requestTime === lastRequestTimeRef.current) {
        setTimetable(result.timetable || []);
        setWeekInfo({ weekStart: result.weekStart, weekEnd: result.weekEnd });
        // Keep currentWeekDate as today for initial load
      }
    } catch (err) {
      if (requestTime === lastRequestTimeRef.current) {
        console.error('[Timetable] Initial load error:', err.message);
        setError(err.message);
      }
    } finally {
      if (requestTime === lastRequestTimeRef.current) {
        setLoading(false);
      }
    }
  };

  // Navigate to prev/next week using the backend navigate endpoint
  const navigateWeek = async (direction, expectedWeekDate) => {
    const requestTime = Date.now();
    lastRequestTimeRef.current = requestTime;

    setLoading(true);

    try {
      const result = await api.postData('/timetable/navigate', { action: direction });

      // Race condition check
      if (requestTime === lastRequestTimeRef.current) {
        setTimetable(result.timetable || []);
        setWeekInfo({ weekStart: result.weekStart, weekEnd: result.weekEnd });
        // currentWeekDate is already set optimistically by handleWeekChange
      }
    } catch (err) {
      if (requestTime === lastRequestTimeRef.current) {
        console.error('[Timetable] Navigation error:', err.message);
        setError(err.message);
      }
    } finally {
      if (requestTime === lastRequestTimeRef.current) {
        setLoading(false);
      }
    }
  };

  // Navigate to a different week (triggered by ribbon prev/next arrows)
  const handleWeekChange = (newDate, direction) => {
    // Clear day selection when changing weeks
    setSelectedDate(null);

    // OPTIMISTIC UPDATE: Update ribbon display immediately
    setCurrentWeekDate(newDate);

    // Also update header optimistically
    try {
      const weekDays = getWeekDays(newDate);
      if (weekDays.length >= 7) {
        const formatDate = (d) => `${d.getDate()}. ${d.getMonth() + 1}.`;
        setWeekInfo({
          weekStart: formatDate(weekDays[0]),
          weekEnd: formatDate(weekDays[6])
        });
      }
    } catch (e) {
      console.error('Error in optimistic week info update:', e);
    }

    // Use navigate endpoint with direction
    navigateWeek(direction, newDate);
  };

  // User clicked a specific day in the ribbon (no API call, just filter)
  const handleDaySelect = (date) => {
    setSelectedDate(date);
  };

  if (error) {
    return (
      <div className="loading-container">
        <div className="error-banner">
          {getFriendlyErrorMessage(error)}
          <button
            onClick={() => { setError(''); loadInitialTimetable(); }}
            className="ml-4 underline text-sm hover:text-red-800"
          >
            Pokušaj ponovno
          </button>
        </div>
      </div>
    );
  }

  // Determine what to display based on selectedDate
  const displayData = selectedDate
    ? (() => {
      // Filter to show only the selected day
      const currentDayStr = formatFullDate(selectedDate);
      // Normalize date strings for comparison (remove extra spaces, normalize separators, handle leading zeros)
      const normalizeDate = (dateStr) => {
        if (!dateStr) return '';
        // Remove trailing dot and spaces
        let clean = dateStr.trim().replace(/\.$/, '').replace(/\s+/g, '');
        // Split by dot
        const parts = clean.split('.');
        // Pad day and month with leading zero
        if (parts[0] && parts[0].length === 1) parts[0] = '0' + parts[0];
        if (parts[1] && parts[1].length === 1) parts[1] = '0' + parts[1];
        return parts.join('.');
      };
      const normalizedSelected = normalizeDate(currentDayStr);

      const dayData = timetable.find((d) => {
        if (d.lessons && d.lessons.length > 0) {
          const hasMatch = d.lessons.some(l => {
            const normL = normalizeDate(l.date);
            const isMatch = normL === normalizedSelected;
            if (debugMode) console.log(`[Filter] Comparing ${normL} (lesson) === ${normalizedSelected} (selected) => ${isMatch}`);
            return isMatch;
          });
          return hasMatch;
        }
        // Fallback: match by day name
        const dayName = selectedDate.toLocaleDateString('hr-HR', { weekday: 'long' });
        return d.day.toLowerCase() === dayName.toLowerCase();
      });
      return dayData ? [dayData] : [];
    })()
    : timetable; // Show all days

  const isWeekView = selectedDate === null;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="max-w-6xl mx-auto">


          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Raspored</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {weekInfo.weekStart && weekInfo.weekEnd
                  ? `${weekInfo.weekStart} - ${weekInfo.weekEnd}`
                  : (loading ? 'Učitavam...' : '')
                }
              </p>
            </div>
            {!isWeekView && (
              <button
                onClick={() => setSelectedDate(null)}
                className="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                ← Prikaži tjedan
              </button>
            )}
          </div>

          <WeekRibbon
            selectedDate={selectedDate}
            currentDate={currentWeekDate}
            onWeekChange={handleWeekChange}
            onDaySelect={handleDaySelect}
          />
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-6xl mx-auto fade-in">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : !isWeekView && displayData.length === 0 ? (
            <EmptyState icon="emptyTimetable" title={`Nema predmeta za ${formatFullDate(selectedDate)}`} />
          ) : displayData.length === 0 ? (
            <EmptyState icon="emptyTimetable" title="Nema predmeta za ovaj tjedan" />
          ) : (
            <div className="space-y-4">
              {displayData.map((day) => {
                const dateStr = day.lessons[0]?.date || '';
                const formattedDate = dateStr.replace(/\.$/, '');
                const isDayHighlighted = selectedDate && dateStr === formatFullDate(selectedDate);

                return (
                  <div
                    key={day.day}
                    className={`card !overflow-visible transition-all duration-300 ${isDayHighlighted ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-3">
                      {day.day}
                      {formattedDate && (
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">({formattedDate})</span>
                      )}
                    </h3>
                    {day.lessons.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Nema predmeta</p>
                    ) : (
                      <div className="space-y-3">
                        {day.lessons.map((lesson, index) => {
                          const isExam = lesson.type?.toLowerCase().includes('ispit');
                          const lessonKey = `${day.day}-${lesson.subject}-${lesson.time}-${index}`;
                          const isCalendarOpen = calendarOpenFor === lessonKey;
                          return (
                            <div key={lessonKey} className={`relative flex items-center gap-4 p-3 rounded-lg ${isExam ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-700'}`}>
                              <div className="text-center min-w-[70px]">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{lesson.time}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{lesson.room}</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">{lesson.subject}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{lesson.professor}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {lesson.type && (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${isExam ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
                                    {lesson.type}
                                  </span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCalendarOpenFor(isCalendarOpen ? null : lessonKey);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-colors"
                                  title="Dodaj u kalendar"
                                >
                                  <Icon name="calendarPlus" className="w-5 h-5" />
                                </button>
                              </div>
                              {isCalendarOpen && (
                                <AddToCalendar
                                  lesson={{ ...lesson, date: lesson.date }}
                                  onClose={() => setCalendarOpenFor(null)}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Timetable;
