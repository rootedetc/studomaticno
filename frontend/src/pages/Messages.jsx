import { useState, useEffect } from 'react';
import api from '../services/api';
import { Skeleton, SkeletonList } from '../components/Skeleton';

function Messages() {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [error, setError] = useState('');

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

  const loadMessageDetail = async (id) => {
    try {
      const result = await api.getMessageThread(id);
      setSelectedMessage(result.message);
    } catch (err) {
      setError(err.message);
    }
  };

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
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 lg:p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Poruke</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} nepročitanih` : 'Sve pročitano'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-6">
        <div className="max-w-4xl mx-auto fade-in">
          {selectedMessage ? (
            <div className="card">
              <button
                onClick={() => setSelectedMessage(null)}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Natrag na popis
              </button>

              <div className="border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{selectedMessage.subject}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                  <span className="font-medium">{selectedMessage.sender}</span>
                  <span>{selectedMessage.sentDate || selectedMessage.date}</span>
                  {selectedMessage.recipient && (
                    <span>→ {selectedMessage.recipient}</span>
                  )}
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-gray-800">
                <div 
                  dangerouslySetInnerHTML={{ __html: selectedMessage.body || 'Nema sadržaja' }} 
                  style={{ lineHeight: '1.6' }}
                />
              </div>

              {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Prilozi</h3>
                  <div className="space-y-2">
                    {selectedMessage.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="flex-1 text-sm text-gray-700">{attachment.name}</span>
                        <button
                          onClick={() => handleDownload(attachment.url, attachment.name)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium flex-shrink-0"
                        >
                          Preuzmi
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.length === 0 ? (
                <div className="card text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">Nema poruka</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => loadMessageDetail(message.id)}
                      className={`card cursor-pointer transition-all hover:shadow-md ${
                        !message.isRead ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          !message.isRead ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <svg className={`w-5 h-5 ${!message.isRead ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!message.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                            )}
                            <h3 className={`font-semibold ${!message.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {message.subject}
                            </h3>
                            {message.hasAttachment && (
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{message.sender}</p>
                          <p className="text-xs text-gray-500">{message.sentDate}</p>
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
      </div>
    </div>
  );
}

export default Messages;
