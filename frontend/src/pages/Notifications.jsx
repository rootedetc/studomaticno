import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getFriendlyErrorMessage } from '../utils/helpers';
import { Skeleton, SkeletonList } from '../components/Skeleton';
import DOMPurify from 'dompurify';
import EmptyState from '../components/EmptyState';
import ListItem from '../components/ListItem';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import useTranslation from '../hooks/useTranslation';
import { usePullToRefresh, PullIndicator } from '../hooks/usePullToRefresh';
import { useOptimisticUpdate } from '../hooks/useOptimisticUpdate';
import BottomSheet from '../components/BottomSheet';
import MessageDetail from '../components/MessageDetail';

function Notifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      setError('Failed to mark notification as read');
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
    const isCurrentlyExpanding = isDesktop && expandedItemId !== notification.id;

    if (!isDesktop) {
      // Show modal immediately with partial data
      setSelectedNotification(notification);
    } else {
      if (expandedItemId === notification.id) {
        setExpandedItemId(null);
        return;
      }
      setExpandedItemId(notification.id);
    }

    setDetailLoading(true);

    if (notification.isNew) {
      handleMarkAsRead(notification);
    }
    try {
      const result = await api.getNotification(notification.id, notification.messageId);
      // Merge new details
      const fullNotification = { ...notification, ...result.notification };

      if (!isDesktop) {
        setSelectedNotification(fullNotification);
      } else {
        setNotifications(prev => prev.map(n => n.id === notification.id ? fullNotification : n));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
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
      <PageHeader
        title="Obavijesti"
        subtitle={unreadCount > 0 ? `${unreadCount} nepročitanih` : 'Sve pročitano'}
      />

      {error && (
        <div className="px-4 md:px-6 mt-4">
          <div className="error-banner">
            {getFriendlyErrorMessage(error)}
          </div>
        </div>
      )}

      <div ref={containerRef} className="page-content">
        <div className="max-w-4xl mx-auto fade-in">
          {notifications.length === 0 ? (
            <EmptyState icon="emptyInbox" title="Nema obavijesti" />
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div key={notification.id}>
                  <ListItem
                    icon="notifications"
                    title={notification.title}
                    subtitle={notification.author}
                    date={notification.date}
                    isNew={notification.isNew}
                    badge={notification.isNew && (
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">Novo</span>
                    )}
                    onClick={() => loadNotificationDetail(notification)}
                    isExpanded={expandedItemId === notification.id}
                  />
                  {isDesktop && expandedItemId === notification.id && (
                    <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800 border-b border-x border-gray-100 dark:border-gray-700 rounded-b-xl -mt-px mb-3 fade-in shadow-sm">
                      {detailLoading ? (
                        <div className="p-4 space-y-3">
                          <Skeleton variant="text" width="60%" />
                          <Skeleton variant="text" count={2} />
                          <Skeleton variant="text" width="40%" />
                        </div>
                      ) : (
                        <MessageDetail item={notification} isInline={true} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notification Detail Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title={selectedNotification?.title || 'Obavijest'}
      >
        {selectedNotification && (
          <div>
            {detailLoading ? (
              <div className="space-y-4">
                <Skeleton variant="text" width="40%" className="mb-2" />
                <Skeleton variant="text" count={3} />
              </div>
            ) : (
              <MessageDetail item={selectedNotification} />
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export default Notifications;
