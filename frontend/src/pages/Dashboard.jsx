import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../App';

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [todayLessons, setTodayLessons] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
    loadTodayTimetable();
    loadNotifications();
    loadMessages();
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await api.getDashboard();
      setData(result);
    } catch (err) {
      console.error('Dashboard error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayTimetable = async () => {
    try {
      const result = await api.getTodayTimetable();
      setTodayLessons(result.lessons || []);
    } catch (err) {
      console.error('Failed to load today timetable:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const result = await api.getNotifications();
      setUnreadNotifications(result.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const loadMessages = async () => {
    try {
      const result = await api.getMessages();
      setUnreadMessages(result.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dobrodošli, {user?.username}</h1>
        <p className="text-gray-600">Pregled vašeg dana</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link to="/notifications" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Obavijesti</p>
              <p className="text-2xl font-bold text-primary-600">{unreadNotifications}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
        </Link>

        <Link to="/messages" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Poruke</p>
              <p className="text-2xl font-bold text-green-600">{unreadMessages}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Link>

        <Link to="/timetable" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Predmeti</p>
              <p className="text-2xl font-bold text-purple-600">{todayLessons.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Današnji raspored</h2>
            <Link to="/timetable" className="text-sm text-primary-600 hover:text-primary-700">
              Pogledaj sve
            </Link>
          </div>
          {todayLessons.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nema predmeta danas</p>
          ) : (
              <div className="space-y-2">
                {todayLessons.map((lesson, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{lesson.subject}</p>
                      <p className="text-sm text-gray-600">{lesson.time} • {lesson.room}</p>
                    </div>
                  </div>
                ))}
              </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
