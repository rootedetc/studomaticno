import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getFriendlyErrorMessage } from '../utils/helpers';
import { Skeleton, SkeletonList } from '../components/Skeleton';
import DOMPurify from 'dompurify';
import EmptyState from '../components/EmptyState';
import ListItem from '../components/ListItem';
import Icon from '../components/Icon';
import { usePullToRefresh, PullIndicator } from '../hooks/usePullToRefresh';
import { useOptimisticUpdate } from '../hooks/useOptimisticUpdate';
import BottomSheet from '../components/BottomSheet';
import MessageDetail from '../components/MessageDetail';
import PageHeader from '../components/PageHeader';

function Inbox() {
    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [expandedItemId, setExpandedItemId] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false); // Helper for expanded view loading
    const [error, setError] = useState('');
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Optimistic update for marking messages as read
    const markMessageAsReadOptimistic = useCallback((messageId) => {
        setItems(prev => prev.map(item =>
            item.type === 'message' && item.id === messageId ? { ...item, isRead: true } : item
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
        return messageId;
    }, []);

    const markMessageAsReadUpdate = useOptimisticUpdate(async (messageId) => {
        return api.markMessageAsRead(messageId);
    });

    // Optimistic update for marking notifications as read
    const markNotificationAsReadOptimistic = useCallback((notificationId) => {
        setItems(prev => prev.map(item =>
            item.type === 'notification' && item.id === notificationId ? { ...item, isNew: false } : item
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
        return notificationId;
    }, []);

    const markNotificationAsReadUpdate = useOptimisticUpdate(async (notificationId) => {
        return api.markNotificationAsRead(notificationId);
    });

    useEffect(() => {
        loadInbox(false);
    }, []);

    const loadInbox = async (useCache = true) => {
        // Helper to parse European date format (DD.MM.YYYY HH:MM)
        const parseDate = (dateStr) => {
            if (!dateStr) return new Date(0);
            // Match DD.MM.YYYY or DD.MM.YYYY HH:MM
            const match = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
            if (match) {
                const [, day, month, year, hours = '0', minutes = '0'] = match;
                return new Date(year, month - 1, day, hours, minutes);
            }
            // Fallback to native parsing
            return new Date(dateStr);
        };

        try {
            // Fetch both messages and notifications in parallel
            const [messagesResult, notificationsResult] = await Promise.all([
                api.getMessages(useCache),
                api.getNotifications(useCache)
            ]);

            const messages = (messagesResult.messages || []).map(msg => ({
                ...msg,
                type: 'message',
                // Normalize date field for sorting
                sortDate: msg.sentDate || msg.date,
                isUnread: !msg.isRead
            }));

            const notifications = (notificationsResult.notifications || [])
                .filter((notification, index, self) =>
                    index === self.findIndex((n) => n.id === notification.id)
                )
                .map(notif => ({
                    ...notif,
                    type: 'notification',
                    // Normalize date field for sorting
                    sortDate: notif.date,
                    isUnread: notif.isNew
                }));

            // Combine and sort by date (newest first)
            const combined = [...messages, ...notifications].sort((a, b) => {
                const dateA = parseDate(a.sortDate);
                const dateB = parseDate(b.sortDate);
                return dateB - dateA;
            });

            setItems(combined);
            setUnreadCount(
                (messagesResult.unreadCount || 0) +
                notifications.filter(n => n.isNew).length
            );
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const loadItemDetail = async (item) => {
        const isCurrentlyExpanding = isDesktop && expandedItemId !== item.id;

        // Mobile Logic: Toggle BottomSheet
        if (!isDesktop) {
            setSelectedItem(item);
            setDetailLoading(true);
        } else {
            // Desktop Logic: Toggle Expansion
            if (expandedItemId === item.id) {
                setExpandedItemId(null);
                return;
            }
            setExpandedItemId(item.id);
            setDetailLoading(true);
        }

        // Mark as read if needed
        if (item.type === 'message') {
            if (!item.isRead) {
                markMessageAsReadOptimistic(item.id);
                try {
                    await markMessageAsReadUpdate.execute(item.id);
                } catch (err) { }
            }

            // Should we fetch details? 
            // If it's desktop and we are expanding, OR if it's mobile and we just opened modal
            // Optimally, check if we already have full details (e.g. body/attachments)
            // But API behavior suggests getMessageThread is needed for full details (like body/attachments if not in list)
            // Actually getMessages result usually has body/attachments for light queries? 
            // Let's assume we always need to fetch to be safe/consistent with existing logic, especially for the thread.

            try {
                const result = await api.getMessageThread(item.id);
                const fullMessage = { ...result.message, type: 'message' };

                if (!isDesktop) {
                    setSelectedItem(fullMessage);
                } else {
                    // Update item in list with full details so MessageDetail can render it
                    setItems(prev => prev.map(i => i.id === item.id && i.type === 'message' ? { ...i, ...fullMessage } : i));
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setDetailLoading(false);
            }
        } else {
            // Notification
            if (item.isNew) {
                markNotificationAsReadOptimistic(item.id);
                try {
                    await markNotificationAsReadUpdate.execute(item.id);
                } catch (err) { }
            }
            try {
                const result = await api.getNotification(item.id, item.messageId);
                const fullNotification = { ...result.notification, type: 'notification' };

                if (!isDesktop) {
                    setSelectedItem(fullNotification);
                } else {
                    setItems(prev => prev.map(i => i.id === item.id && i.type === 'notification' ? { ...i, ...fullNotification } : i));
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setDetailLoading(false);
            }
        }
    };

    const handleRefresh = useCallback(async () => {
        setLoading(true);
        await loadInbox();
    }, []);

    const { containerRef, isRefreshing, pullProgress } = usePullToRefresh(handleRefresh);

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
                title="Sandučić"
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
                    {items.length === 0 ? (
                        <EmptyState icon="inbox" title="Nema poruka ni obavijesti" />
                    ) : (
                        <div className="space-y-2">
                            {items.map((item) => (
                                <div key={`${item.type}-${item.id}`}>
                                    <ListItem
                                        icon={item.type === 'message' ? 'messages' : 'notifications'}
                                        title={item.type === 'message' ? item.subject : item.title}
                                        subtitle={item.type === 'message' ? item.sender : item.author}
                                        date={item.type === 'message' ? item.sentDate : item.date}
                                        isNew={item.type === 'message' ? !item.isRead : item.isNew}
                                        hasAttachment={item.type === 'message' && item.hasAttachment}
                                        onClick={() => loadItemDetail(item)}
                                        isExpanded={expandedItemId === item.id}
                                    />
                                    {isDesktop && expandedItemId === item.id && (
                                        <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800 border-b border-x border-gray-100 dark:border-gray-700 rounded-b-xl -mt-px mb-3 fade-in shadow-sm">
                                            {detailLoading ? (
                                                <div className="p-4 space-y-3">
                                                    <Skeleton variant="text" width="60%" />
                                                    <Skeleton variant="text" count={2} />
                                                    <Skeleton variant="text" width="40%" />
                                                </div>
                                            ) : (
                                                <MessageDetail item={item} isInline={true} />
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Bottom Sheet - Mobile Only */}
            <BottomSheet
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                title={selectedItem?.type === 'message' ? (selectedItem?.subject || 'Poruka') : (selectedItem?.title || 'Obavijest')}
            >
            {selectedItem && (
                <MessageDetail item={selectedItem} loading={detailLoading} />
            )}
            </BottomSheet>
        </div>
    );
}

export default Inbox;
