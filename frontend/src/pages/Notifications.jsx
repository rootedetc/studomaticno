import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getFriendlyErrorMessage } from '../utils/helpers';
import { Skeleton, SkeletonList } from '../components/Skeleton';
import DOMPurify from 'dompurify';
import EmptyState from '../components/EmptyState';
import ListItem from '../components/ListItem';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import MobileHeader from '../components/MobileHeader';
import useTranslation from '../hooks/useTranslation';
import { usePullToRefresh, PullIndicator } from '../hooks/usePullToRefresh';
import { useOptimisticUpdate } from '../hooks/useOptimisticUpdate';

function Notifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [error, setError] = useState('');

  const markAsReadOptimistic = useCallback((notificationId) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, isNew: false } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
    return notificationId;
  }, []);

  const markAsReadUpdate = useOptimisticUpdate(async (notificationId) => {
    return api.markNotificationAsRead(notificationId);
  });

  const handleMarkAsRead = useCallback(async (notification) => {
    if (!notification.isNew) return;

    markAsReadOptimistic(notification.id);

    try {
      await markAsReadUpdate.execute(notification.id);
    } catch (err) {
    }
  }, [markAsReadOptimistic, markAsReadUpdate]);

  useEffect(() => {
    const refresh = new URLSearchParams(window.location.search).get('refresh');
    loadNotifications(refresh === 'true');
  }, []);

  const loadNotifications = async (useCache = true) => {
    try {
      const result = await api.getNotifications(useCache);
      const uniqueNotifications = result.notifications.filter((notification, index, self) =>
        index === self.findIndex((n) => n.id === notification.id)
      );
      setNotifications(uniqueNotifications);
      setUnreadCount(uniqueNotifications.filter(n => n.isNew).length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationDetail = async (notification) => {
    if (notification.isNew) {
      handleMarkAsRead(notification);
    }
    try {
      const result = await api.getNotification(notification.id, notification.messageId);
      setSelectedNotification(result.notification);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await loadNotifications(true);
  }, [loadNotifications]);

  const { containerRef, isRefreshing, pullDistance, pullProgress } = usePullToRefresh(handleRefresh);

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <Skeleton variant="text" height="h-8" width="w-32" className="mb-2" />
          <Skeleton variant="text" width="w-24" />
        </div>
        <SkeletonList items={7} />
      </div>
    );
  }

  return (
    <div className="page-container relative">
      <PullIndicator isRefreshing={isRefreshing} pullProgress={pullProgress} />
      <div className="page-header">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Obavijesti</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {unreadCount > 0 ? `${unreadCount} nepročitanih` : 'Sve pročitano'}
            </p>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {getFriendlyErrorMessage(error)}
          </div>
        )}
      </div>

      <div ref={containerRef} className="page-content">
        <div className="max-w-4xl mx-auto fade-in">
          {selectedNotification ? (
            <div className="card md:p-6 p-0 border-0 md:border shadow-none md:shadow-sm bg-transparent md:bg-white md:dark:bg-gray-800">
              {/* Mobile Header for Details */}
              <div className="md:hidden">
                <MobileHeader title="Detalji obavijesti" onBack={() => setSelectedNotification(null)} />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 md:border-0 p-4 md:p-0">
                <div className="hidden md:block">
                  <PageHeader
                    title={selectedNotification.title}
                    breadcrumbs={[
                      { label: 'Obavijesti', onClick: () => setSelectedNotification(null) }
                    ]}
                  />
                </div>

                {/* Mobile Title */}
                <div className="md:hidden mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedNotification.title}</h2>
                </div>

                <div className="md:px-6 md:pb-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Icon name="user" className="w-4 h-4" aria-hidden="true" />
                      <span className="font-medium text-gray-900 dark:text-white">{selectedNotification.author}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="clock" className="w-4 h-4" aria-hidden="true" />
                      {selectedNotification.date}
                    </span>
                  </div>

                  <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200">
                    <div
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedNotification.content || '') }}
                      style={{ lineHeight: '1.6' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {notifications.length === 0 ? (
                <EmptyState icon="emptyInbox" title="Nema obavijesti" />
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <ListItem
                      key={notification.id}
                      icon="notifications"
                      title={notification.title}
                      subtitle={notification.author}
                      date={notification.date}
                      isNew={notification.isNew}
                      badge={notification.isNew && (
                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">Novo</span>
                      )}
                      onClick={() => loadNotificationDetail(notification)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div >
  );
}

export default Notifications;
