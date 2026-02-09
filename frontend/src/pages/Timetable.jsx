import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { getFriendlyErrorMessage } from '../utils/helpers';
import { formatFullDate, getWeekDays, addWeeks } from '../utils/dateUtils';
import { SkeletonCard } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import WeekRibbon from '../components/WeekRibbon';
import AddToCalendar from '../components/AddToCalendar';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';

function Timetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  // null = show all days, Date = show only that day (filter locally)
  const [selectedDate, setSelectedDate] = useState(null);
  const [error, setError] = useState('');
  const [weekInfo, setWeekInfo] = useState({ weekStart: '', weekEnd: '' });
  // Track the current week's reference date for ribbon display
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  const [calendarOpenFor, setCalendarOpenFor] = useState(null);
  const calendarButtonRef = useRef(null);

  // Ref to track the latest request timestamp to handle race conditions
  const lastRequestTimeRef = useRef(0);

  useEffect(() => {
    // Initial load - load the current week from the server
    loadInitialTimetable();
  }, []);

  // Parse a date string from API (e.g., "26. 1." or "26. 1. 2026." or "15. veljače 2026.") to a Date object
  const parseWeekStartDate = (dateStr, referenceDate = new Date()) => {
    if (!dateStr) return referenceDate;
    try {
      // Remove trailing dots, clean up spaces
      const clean = dateStr.replace(/\.$/, '').trim();

      // Handle Croatian month names
      const monthMap = {
        'siječnja': 0, 'siječanj': 0, '1.': 0,
        'veljače': 1, 'veljača': 1, '2.': 1,
        'ožujka': 2, 'ožujak': 2, '3.': 2,
        'travnja': 3, 'travanj': 3, '4.': 3,
        'svibnja': 4, 'svibanj': 4, '5.': 4,
        'lipnja': 5, 'lipanj': 5, '6.': 5,
        'srpnja': 6, 'srpanj': 6, '7.': 6,
        'kolovoza': 7, 'kolovoz': 7, '8.': 7,
        'rujna': 8, 'rujan': 8, '9.': 8,
        'listopada': 9, 'listopad': 9, '10.': 9,
        'studenoga': 10, 'studeni': 10, '11.': 10,
        'prosinca': 11, 'prosinac': 11, '12.': 11
      };

      // Try matching month names first
      // Regex to split by dots or spaces
      const parts = clean.split(/[\.\s]+/).filter(p => p);

      if (parts.length >= 2) {
        const day = parseInt(parts[0], 10);
        let month = -1;
        let year = referenceDate.getFullYear();

        // Check if second part is a number or text
        if (!isNaN(parseInt(parts[1], 10))) {
          month = parseInt(parts[1], 10) - 1;
        } else {
          // Try to look up month name (case insensitive)
          const monthName = parts[1].toLowerCase();
          Object.keys(monthMap).forEach(key => {
            if (monthName.startsWith(key) || key.startsWith(monthName)) {
              month = monthMap[key];
            }
          });
        }

        // Check for year
        if (parts.length >= 3) {
          const parsedYear = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(parsedYear) && parsedYear > 2000) {
            year = parsedYear;
          }
        }

        if (!isNaN(day) && month !== -1) {
          return new Date(year, month, day);
        }
      }
    } catch (e) {
      console.error('Error parsing week start date:', e);
    }
    return referenceDate;
  };

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

        // Sync currentWeekDate with the actual week returned by the API
        if (result.weekStart) {
          const parsedDate = parseWeekStartDate(result.weekStart);
          setCurrentWeekDate(parsedDate);
        }
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

        // Sync currentWeekDate with the actual week returned by the API
        if (result.weekStart) {
          const parsedDate = parseWeekStartDate(result.weekStart);
          setCurrentWeekDate(parsedDate);
        }
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
        // We use our new util for better month formatting
        const monthNames = ['siječnja', 'veljače', 'ožujka', 'travnja', 'svibnja', 'lipnja', 'srpnja', 'kolovoza', 'rujna', 'listopada', 'studenoga', 'prosinca'];
        const formatHumanDate = (d) => `${d.getDate()}. ${monthNames[d.getMonth()]} ${d.getFullYear()}.`;

        setWeekInfo({
          weekStart: formatHumanDate(weekDays[0]),
          weekEnd: formatHumanDate(weekDays[6])
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
      <PageHeader
        title="Raspored"
        subtitle={weekInfo.weekStart && weekInfo.weekEnd
          ? `${weekInfo.weekStart} - ${weekInfo.weekEnd}`
          : (loading ? 'Učitavam...' : '')
        }
        actions={!isWeekView && (
          <button
            onClick={() => setSelectedDate(null)}
            className="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            ← Prikaži tjedan
          </button>
        )}
      >
        <div className="max-w-6xl mx-auto w-full">
          <WeekRibbon
            selectedDate={selectedDate}
            currentDate={currentWeekDate}
            daysWithEvents={timetable
              .filter(day => day.lessons && day.lessons.length > 0)
              .flatMap(day => day.lessons.map(lesson => lesson.date))
              .filter(Boolean)}
            onWeekChange={handleWeekChange}
            onDaySelect={handleDaySelect}
          />
        </div>
      </PageHeader>

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
                            <div key={lessonKey} className={`relative flex items-center gap-4 p-3 rounded-lg transition-all duration-200 ${isExam ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-700'} ${isCalendarOpen ? 'z-50 ring-2 ring-primary-400 shadow-md' : 'z-0'}`}>
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
                                  ref={isCalendarOpen ? calendarButtonRef : null}
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
                                  anchorRef={calendarButtonRef}
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
