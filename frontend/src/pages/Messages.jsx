import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getFriendlyErrorMessage } from '../utils/helpers';
import { Skeleton, SkeletonList } from '../components/Skeleton';
import DOMPurify from 'dompurify';
import EmptyState from '../components/EmptyState';
import ListItem from '../components/ListItem';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { usePullToRefresh, PullIndicator } from '../hooks/usePullToRefresh';
import { useOptimisticUpdate } from '../hooks/useOptimisticUpdate';
import BottomSheet from '../components/BottomSheet';
import MessageDetail from '../components/MessageDetail';

function Messages() {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const markAsReadOptimistic = useCallback((messageId) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, isRead: true } : m
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
    return messageId;
  }, []);

  const markAsReadUpdate = useOptimisticUpdate(async (messageId) => {
    return api.markMessageAsRead(messageId);
  });

  const handleMarkAsRead = useCallback(async (messageId) => {
    markAsReadOptimistic(messageId);

    try {
      await markAsReadUpdate.execute(messageId);
    } catch (err) {
      setError('Failed to mark message as read');
    }
  }, [markAsReadOptimistic, markAsReadUpdate]);

  useEffect(() => {
    loadMessages(false);
  }, []);

  const loadMessages = async (useCache = true) => {
    try {
      const result = await api.getMessages(useCache);
      setMessages(result.messages || []);
      setUnreadCount(result.unreadCount || 0);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const loadMessageDetail = async (messageId, message) => {
    const isCurrentlyExpanding = isDesktop && expandedItemId !== messageId;

    if (!isDesktop) {
      // Show modal immediately with available data
      setSelectedMessage(message);
    } else {
      if (expandedItemId === messageId) {
        setExpandedItemId(null);
        return;
      }
      setExpandedItemId(messageId);
    }

    setDetailLoading(true);

    if (message && !message.isRead) {
      handleMarkAsRead(messageId);
    }

    try {
      const result = await api.getMessageThread(messageId);
      // Merge new details with existing message data
      const fullMessage = { ...message, ...result.message };

      if (!isDesktop) {
        setSelectedMessage(fullMessage);
      } else {
        setMessages(prev => prev.map(m => m.id === messageId ? fullMessage : m));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await loadMessages();
  }, [loadMessages]);

  const { containerRef, isRefreshing, pullDistance, pullProgress } = usePullToRefresh(handleRefresh);

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError('Download failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <Skeleton variant="text" height="h-8" width="w-24" className="mb-2" />
          <Skeleton variant="text" width="w-32" />
        </div>
        <SkeletonList items={7} />
      </div>
    );
  }

  return (
    <div className="page-container relative">
      <PullIndicator isRefreshing={isRefreshing} pullProgress={pullProgress} />
      <PageHeader
        title="Poruke"
        subtitle={unreadCount > 0 ? `${unreadCount} nepročitanih` : 'Sve pročitano'}
      />

      {error && (
        <div className="mx-4 md:mx-6 mt-4">
          <div className="error-banner">
            {getFriendlyErrorMessage(error)}
          </div>
        </div>
      )}

      <div ref={containerRef} className="page-content">
        <div className="max-w-4xl mx-auto fade-in">
          {messages.length === 0 ? (
            <EmptyState icon="messages" title="Nema poruka" />
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <div key={message.id}>
                  <ListItem
                    icon="messages"
                    title={message.subject}
                    subtitle={message.sender}
                    date={message.sentDate}
                    isNew={!message.isRead}
                    hasAttachment={message.hasAttachment}
                    onClick={() => loadMessageDetail(message.id, message)}
                    isExpanded={expandedItemId === message.id}
                  />
                  {isDesktop && expandedItemId === message.id && (
                    <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800 border-b border-x border-gray-100 dark:border-gray-700 rounded-b-xl -mt-px mb-3 fade-in shadow-sm">
                      {detailLoading ? (
                        <div className="p-4 space-y-3">
                          <Skeleton variant="text" width="60%" />
                          <Skeleton variant="text" count={2} />
                          <Skeleton variant="text" width="40%" />
                        </div>
                      ) : (
                        <MessageDetail item={message} isInline={true} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Detail Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        title={selectedMessage?.subject || 'Poruka'}
      >
        {selectedMessage && (
          <div>
            {detailLoading ? (
              <div className="space-y-4">
                <Skeleton variant="text" count={3} />
                <Skeleton variant="text" width="60%" />
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Skeleton variant="text" width="30%" className="mb-2" />
                  <Skeleton variant="text" height="h-12" />
                </div>
              </div>
            ) : (
              <MessageDetail item={selectedMessage} loading={detailLoading} />
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export default Messages;
