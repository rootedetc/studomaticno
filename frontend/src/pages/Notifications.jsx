import { useState, useEffect } from 'react';
import api from '../services/api';
import { Skeleton, SkeletonList } from '../components/Skeleton';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const result = await api.getNotifications();
      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationDetail = async (notification) => {
    try {
      const result = await api.getNotification(notification.id, notification.messageId);
      setSelectedNotification(result.notification);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <Skeleton variant="text" height="h-8" width="w-32" className="mb-2" />
          <Skeleton variant="text" width="w-24" />
        </div>
        <SkeletonList items={7} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Obavijesti</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {unreadCount > 0 ? `${unreadCount} nepročitanih` : 'Sve pročitano'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {selectedNotification ? (
        <div className="card">
          <button
            onClick={() => setSelectedNotification(null)}
            className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Natrag na popis
          </button>

          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{selectedNotification.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">{selectedNotification.author}</span>
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {selectedNotification.date}
              </span>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200">
            <div 
              dangerouslySetInnerHTML={{ __html: selectedNotification.content || '' }}
              style={{ lineHeight: '1.6' }}
            />
          </div>
        </div>
      ) : (
        <>
          {notifications.length === 0 ? (
            <div className="card text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500">Nema obavijesti</p>
            </div>
          ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => loadNotificationDetail(notification)}
                    className={`card cursor-pointer transition-all hover:shadow-md ${
                      notification.isNew ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      notification.isNew ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <svg className={`w-5 h-5 ${notification.isNew ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {notification.isNew && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                        <h3 className={`font-semibold ${notification.isNew ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">{notification.author}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{notification.date}</span>
                        {notification.isNew && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium flex-shrink-0">Novo</span>
                        )}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Notifications;
