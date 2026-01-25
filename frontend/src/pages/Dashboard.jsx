import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../App';
import { Skeleton, SkeletonCard } from '../components/Skeleton';
import { getDailyCache, setDailyCache } from '../utils/cache';
import { getNextLesson, getFriendlyErrorMessage } from '../utils/helpers';
import StickyAnnouncements from '../components/StickyAnnouncements';
import { usePullToRefresh, PullIndicator } from '../hooks/usePullToRefresh';

function Dashboard() {
  const { user, stickyAnnouncements, setStickyAnnouncements } = useAuth();
  const [data, setData] = useState(null);
  const [todayLessons, setTodayLessons] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [showStickyAnnouncements, setShowStickyAnnouncements] = useState(false);
  const nextLesson = getNextLesson(todayLessons);

  useEffect(() => {
    loadFromCache();
    refreshData();

    if (stickyAnnouncements && stickyAnnouncements.length > 0) {
      setShowStickyAnnouncements(true);
    }
  }, []);

  const loadFromCache = useCallback(async () => {
    try {
      const cachedDashboard = getDailyCache('dashboard_overview');
      if (cachedDashboard) {
        setData(cachedDashboard);
      }

      const dateKey = new Date().toISOString().split('T')[0];
      const cachedTimetable = getDailyCache(`timetable_today_${dateKey}`);
      if (cachedTimetable) {
        setTodayLessons(cachedTimetable.lessons || []);
      }

      const cachedNotifications = getDailyCache('notifications_list');
      if (cachedNotifications) {
        setUnreadNotifications(cachedNotifications.unreadCount || 0);
      }

      const cachedMessages = getDailyCache('messages_inbox');
      if (cachedMessages) {
        setUnreadMessages(cachedMessages.unreadCount || 0);
      }

      setCacheLoaded(true);
    } catch (err) {
      console.error('Failed to load from cache:', err);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([
      loadDashboard(true),
      loadTodayTimetable(true),
      loadNotifications(true),
      loadMessages(true)
    ]);
    setLoading(false);
  }, []);

  const loadDashboard = useCallback(async (refresh = false) => {
    try {
      const result = await api.getDashboard(!refresh);
      setData(result);
      if (!refresh) {
        setDailyCache('dashboard_overview', result);
      }
    } catch (err) {
      console.error('Dashboard error:', err.message);
    }
  }, []);

  const loadTodayTimetable = useCallback(async (refresh = false) => {
    try {
      const result = await api.getTodayTimetable(!refresh);
      setTodayLessons(result.lessons || []);
      if (!refresh) {
        const dateKey = new Date().toISOString().split('T')[0];
        setDailyCache(`timetable_today_${dateKey}`, result);
      }
    } catch (err) {
      console.error('Failed to load today timetable:', err);
    }
  }, []);

  const loadNotifications = useCallback(async (refresh = false) => {
    try {
      const result = await api.getNotifications(!refresh);
      setUnreadNotifications(result.unreadCount || 0);
      if (!refresh) {
        setDailyCache('notifications_list', result);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, []);

  const loadMessages = useCallback(async (refresh = false) => {
    try {
      const result = await api.getMessages(!refresh);
      setUnreadMessages(result.unreadCount || 0);
      if (!refresh) {
        setDailyCache('messages_inbox', result);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  const handleDismissSticky = useCallback(() => {
    setShowStickyAnnouncements(false);
    setStickyAnnouncements([]);
  }, [setStickyAnnouncements]);

  const handleRefresh = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  const { containerRef, isRefreshing, pullDistance, pullProgress } = usePullToRefresh(handleRefresh);

  if (loading && !cacheLoaded) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <Skeleton variant="text" height="h-8" width="w-48" className="mb-2" />
          <Skeleton variant="text" width="w-32" />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
          <SkeletonCard count={4} />
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Dobro jutro';
    if (hour < 18) return 'Dobar dan';
    return 'Dobro večer';
  };

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <PullIndicator isRefreshing={isRefreshing} pullProgress={pullProgress} />
      <div className="p-4 lg:p-6 flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {getGreeting()}, {user?.username}!
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString('hr-HR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            {nextLesson ? (
              <div className="w-full md:w-auto bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-300 font-bold shrink-0">
                  {nextLesson.time.split(' - ')[0]}
                </div>
                <div>
                  <p className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide">Sljedeće</p>
                  <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{nextLesson.subject}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{nextLesson.room}</p>
                </div>
              </div>
            ) : (
              <div className="hidden md:block text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Nema više predavanja danas</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">Uživajte u ostatku dana!</p>
              </div>
            )}
          </div>

          {error && (
            <div className="error-banner">
              {getFriendlyErrorMessage(error)}
            </div>
          )}

          {showStickyAnnouncements && stickyAnnouncements.length > 0 && (
            <StickyAnnouncements
              announcements={stickyAnnouncements}
              onDismiss={handleDismissSticky}
            />
          )}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="max-w-6xl mx-auto fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Link to="/inbox" className="card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sandučić</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{unreadNotifications + unreadMessages}</p>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center icon-bg-blue">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link to="/timetable" className="card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Predmeti</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{todayLessons.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center icon-bg-purple">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Današnji raspored</h2>
                <Link to="/timetable" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                  Pogledaj sve
                </Link>
              </div>
              {todayLessons.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 sm:py-8">Nema predmeta danas</p>
              ) : (
                <div className="space-y-2">
                  {todayLessons.map((lesson, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">{lesson.subject}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{lesson.time} • {lesson.room}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
