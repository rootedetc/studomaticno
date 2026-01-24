import DOMPurify from 'dompurify';
import Icon from './Icon';

function MessageDetail({ item, loading, isInline = false }) {
    if (loading) return null;

    if (!item) return null;

    const isMessage = item.type === 'message';

    return (
        <div className={`${isInline ? '' : 'p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 mt-2 mb-4'} fade-in`}>
            {/* Header Info */}
            {!isInline && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                    {isMessage ? (
                        <>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white">{item.sender}</span>
                            </div>
                            <span>{item.sentDate || item.date}</span>
                            {item.recipient && (
                                <span>→ {item.recipient}</span>
                            )}
                        </>
                    ) : (
                        <>
                            <span className="flex items-center gap-1">
                                <Icon name="user" className="w-4 h-4" aria-hidden="true" />
                                <span className="font-medium text-gray-900 dark:text-white">{item.author}</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <Icon name="clock" className="w-4 h-4" aria-hidden="true" />
                                {item.date}
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* Body Content */}
            <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-300">
                <div
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.body || item.content || 'Nema sadržaja') }}
                    style={{ lineHeight: '1.6' }}
                />
            </div>

            {/* Attachments */}
            {isMessage && item.attachments && item.attachments.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                        <Icon name="attachment" className="w-4 h-4" />
                        Prilozi
                    </h3>
                    <div className="space-y-2">
                        {item.attachments.map((attachment, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg group hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Download logic should ideally be passed in or handled via a global helper context if possible, 
                                    // but for now we'll duplicate the download logic or pass a handler? 
                                    // Let's pass a handler prop.
                                }}
                            >
                                <Icon name="attachment" className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors" aria-hidden="true" />
                                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 font-medium truncate">{attachment.name}</span>
                                <a
                                    href={attachment.url}
                                    download={attachment.name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()} // Let the anchor tag do its work or prevent default if we want custom handler
                                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs font-bold uppercase tracking-wide px-2 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                >
                                    Preuzmi
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MessageDetail;
