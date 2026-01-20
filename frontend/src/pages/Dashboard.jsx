import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../App';
import { Skeleton, SkeletonCard } from '../components/Skeleton';
import { getDailyCache, setDailyCache } from '../utils/cache';

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [todayLessons, setTodayLessons] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cacheLoaded, setCacheLoaded] = useState(false);

  useEffect(() => {
    loadFromCache();
    refreshData();
  }, []);

  const loadFromCache = async () => {
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
  };

  const refreshData = async () => {
    await Promise.all([
      loadDashboard(true),
      loadTodayTimetable(true),
      loadNotifications(true),
      loadMessages(true)
    ]);
    setLoading(false);
  };

  const loadDashboard = async (refresh = false) => {
    try {
      const result = await api.getDashboard(!refresh);
      setData(result);
      if (!refresh) {
        setDailyCache('dashboard_overview', result);
      }
    } catch (err) {
      console.error('Dashboard error:', err.message);
    }
  };

  const loadTodayTimetable = async (refresh = false) => {
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
  };

  const loadNotifications = async (refresh = false) => {
    try {
      const result = await api.getNotifications(!refresh);
      setUnreadNotifications(result.unreadCount || 0);
      if (!refresh) {
        setDailyCache('notifications_list', result);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const loadMessages = async (refresh = false) => {
    try {
      const result = await api.getMessages(!refresh);
      setUnreadMessages(result.unreadCount || 0);
      if (!refresh) {
        setDailyCache('messages_inbox', result);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

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
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 lg:p-6 flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-6 lg:p-8 mb-6 shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
            
            <div className="relative z-10">
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                {getGreeting()}, {user?.username}!
              </h1>
              <p className="text-primary-100 text-lg">Dobrodošli nazad na studomaticno</p>
              
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-white font-medium">{new Date().toLocaleDateString('hr-HR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white font-medium">{new Date().toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="max-w-6xl mx-auto fade-in">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Link to="/notifications" className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Obavijesti</p>
                  <p className="text-2xl font-bold text-primary-600">{unreadNotifications}</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link to="/messages" className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Poruke</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{unreadMessages}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link to="/timetable" className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Predmeti</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{todayLessons.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
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
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">Nema predmeta danas</p>
              ) : (
                <div className="space-y-2">
                  {todayLessons.map((lesson, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
