import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getFriendlyErrorMessage } from '../utils/helpers';
import MobileHeader from '../components/MobileHeader';
import { Skeleton, SkeletonList } from '../components/Skeleton';
import DOMPurify from 'dompurify';
import EmptyState from '../components/EmptyState';
import ListItem from '../components/ListItem';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { usePullToRefresh, PullIndicator } from '../hooks/usePullToRefresh';
import { useOptimisticUpdate } from '../hooks/useOptimisticUpdate';

function Messages() {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [error, setError] = useState('');

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
    }
  }, [markAsReadOptimistic, markAsReadUpdate]);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const result = await api.getMessages();
      setMessages(result.messages || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMessageDetail = async (messageId, message) => {
    if (message && !message.isRead) {
      handleMarkAsRead(messageId);
    }
    try {
      const result = await api.getMessageThread(messageId);
      setSelectedMessage(result.message);
    } catch (err) {
      setError(err.message);
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
      {!selectedMessage && (
        <div className="page-header">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Poruke</h1>
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
      )}

      <div ref={containerRef} className="page-content">
        <div className="max-w-4xl mx-auto fade-in">
          {selectedMessage ? (
            <div className="card md:p-6 p-0 border-0 md:border shadow-none md:shadow-sm bg-transparent md:bg-white md:dark:bg-gray-800">
              {/* Mobile Header for Details */}
              <div className="md:hidden">
                <MobileHeader title="Detalji poruke" onBack={() => setSelectedMessage(null)} />
              </div>

              {/* Desktop Header / Content Container */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 md:border-0 p-4 md:p-0">
                <div className="hidden md:block">
                  <PageHeader
                    title={selectedMessage.subject}
                    breadcrumbs={[
                      { label: 'Poruke', onClick: () => setSelectedMessage(null) }
                    ]}
                  />
                </div>

                {/* Mobile Title (since header is generic) */}
                <div className="md:hidden mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedMessage.subject}</h2>
                </div>

                <div className="md:px-6 md:pb-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span className="font-medium text-gray-900 dark:text-white">{selectedMessage.sender}</span>
                    <span>{selectedMessage.sentDate || selectedMessage.date}</span>
                    {selectedMessage.recipient && (
                      <span>→ {selectedMessage.recipient}</span>
                    )}
                  </div>

                  <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-300">
                    <div
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedMessage.body || 'Nema sadržaja') }}
                      style={{ lineHeight: '1.6' }}
                    />
                  </div>

                  {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Prilozi</h3>
                      <div className="space-y-2">
                        {selectedMessage.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <Icon name="attachment" className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" aria-hidden="true" />
                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{attachment.name}</span>
                            <button
                              onClick={() => handleDownload(attachment.url, attachment.name)}
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium flex-shrink-0"
                            >
                              Preuzmi
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
        ) : (
        <>
          {messages.length === 0 ? (
            <EmptyState icon="messages" title="Nema poruka" />
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <ListItem
                  key={message.id}
                  icon="messages"
                  title={message.subject}
                  subtitle={message.sender}
                  date={message.sentDate}
                  isNew={!message.isRead}
                  hasAttachment={message.hasAttachment}
                  onClick={() => loadMessageDetail(message.id, message)}
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

export default Messages;
