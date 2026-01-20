import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Skeleton, SkeletonCard } from '../components/Skeleton';

function Timetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('weekly');
  const [selectedDay, setSelectedDay] = useState(null);
  const [error, setError] = useState('');
  const [weekInfo, setWeekInfo] = useState({ weekStart: '', weekEnd: '' });
  const [navigating, setNavigating] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDebugMode(params.get('debug') === 'true');
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    try {
      const result = await api.getTimetable();
      setTimetable(result.timetable || []);
      setWeekInfo({ weekStart: result.weekStart, weekEnd: result.weekEnd });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = async (direction) => {
    setNavigating(true);
    try {
      const result = await api.postData('/timetable/navigate', { action: direction });
      setTimetable(result.timetable || []);
      setWeekInfo({ weekStart: result.weekStart, weekEnd: result.weekEnd });
    } catch (err) {
      setError(err.message);
    } finally {
      setNavigating(false);
    }
  };

  const loadDate = async (dateStr) => {
    if (!dateStr) return;
    setNavigating(true);
    console.log('[DatePicker] Loading date:', dateStr);
    try {
      const date = new Date(dateStr);
      const dayName = date.toLocaleDateString('hr-HR', { weekday: 'long' });
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const edunetaDate = `${dayName}, ${day}. ${month}. ${year}.`;
      console.log('[DatePicker] Eduneta date:', edunetaDate);
      
      const result = await api.postData('/timetable/set-date', { date: edunetaDate });
      console.log('[DatePicker] Result:', result);
      setTimetable(result.timetable || []);
      setWeekInfo({ weekStart: result.weekStart, weekEnd: result.weekEnd });
    } catch (err) {
      console.error('[DatePicker] Error:', err.message);
      setError(err.message);
    } finally {
      setNavigating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <Skeleton variant="text" height="h-8" width="w-32" className="mb-2" />
          <Skeleton variant="text" width="w-48" />
        </div>
        <div className="flex gap-2 mb-6">
          <Skeleton variant="text" width="w-20" height="h-10" />
          <Skeleton variant="text" width="w-20" height="h-10" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 lg:p-6 flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          {debugMode && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs font-mono">
              <pre className="text-yellow-800 dark:text-yellow-200">{JSON.stringify({ weekInfo, daysCount: timetable.length }, null, 2)}</pre>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Raspored</h1>
              <p className="text-gray-600 dark:text-gray-400">{weekInfo.weekStart} - {weekInfo.weekEnd}</p>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <button
                onClick={() => navigateWeek('prev')}
                disabled={navigating}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                « Prošli
              </button>
              <button
                onClick={() => navigateWeek('next')}
                disabled={navigating}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Sljedeći »
              </button>
              <input
                type="date"
                onChange={(e) => e.target.value && loadDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView('weekly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'weekly' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Tjedan
            </button>
            <button
              onClick={() => setView('daily')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'daily' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Dan
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-6">
        <div className="max-w-6xl mx-auto fade-in">
          {view === 'daily' ? (
            <div>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                {timetable.map((day) => {
                  const dateStr = day.lessons[0]?.date || '';
                  const formattedDate = dateStr.replace(/\.$/, '');
                  return (
                    <button
                      key={day.day}
                      onClick={() => setSelectedDay(day.day)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedDay === day.day ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span>{day.day}</span>
                        {formattedDate && <span className="text-xs font-normal opacity-75">{formattedDate}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedDay ? (
                (() => {
                  const dayData = timetable.find((d) => d.day === selectedDay);
                  if (!dayData || dayData.lessons.length === 0) {
                    return <div className="card text-center py-12"><p className="text-gray-500 dark:text-gray-400">Nema predmeta za ovaj dan</p></div>;
                  }
                  return (
                    <div className="space-y-3">
                      {dayData.lessons.map((lesson, index) => {
                        const isExam = lesson.type?.toLowerCase().includes('ispit');
                        return (
                          <div key={index} className={`card ${isExam ? 'border-2 border-red-200 dark:border-red-800' : ''}`}>
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{lesson.subject}</h3>
                                <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                  <span className="flex items-center gap-1">🕐 {lesson.time}</span>
                                  {lesson.room && <span>📍 {lesson.room}</span>}
                                  {lesson.professor && <span>👤 {lesson.professor}</span>}
                                  {lesson.type && (
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${isExam ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                      {lesson.type}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <div className="card text-center py-12"><p className="text-gray-500 dark:text-gray-400">Odaberite dan za prikaz rasporeda</p></div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {timetable.map((day) => {
                const dateStr = day.lessons[0]?.date || '';
                const formattedDate = dateStr.replace(/\.$/, '');
                return (
                  <div key={day.day} className="card">
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
                          return (
                            <div key={index} className={`flex items-center gap-4 p-3 rounded-lg ${isExam ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-700'}`}>
                              <div className="text-center min-w-[70px]">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{lesson.time}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{lesson.room}</p>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">{lesson.subject}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{lesson.professor}</p>
                              </div>
                              {lesson.type && (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${isExam ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
                                  {lesson.type}
                                </span>
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
