import { memo, useMemo } from 'react';
import DOMPurify from 'dompurify';

const StickyAnnouncements = memo(function StickyAnnouncements({ announcements, onDismiss }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!announcements || announcements.length === 0) {
    return null;
  }

  const current = announcements[currentIndex];
  const hasNext = currentIndex < announcements.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = useCallback(() => {
    if (hasNext) {
      setCurrentIndex(prev => prev + 1);
      setIsExpanded(false);
    }
  }, [hasNext]);

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      setCurrentIndex(prev => prev - 1);
      setIsExpanded(false);
    }
  }, [hasPrev]);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  const handleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const counterText = useMemo(() => 
    `${currentIndex + 1} / ${announcements.length}`,
    [currentIndex, announcements.length]
  );

  return (
    <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Važna obavijest</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-600 dark:text-amber-400">
            {counterText}
          </span>
          <button
            onClick={handleDismiss}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
            title="Zatvori"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{current.title}</h3>

      <div className="relative">
        <div className={`text-sm text-gray-700 dark:text-gray-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(current.body || '') }} />
        </div>
        {current.body && current.body.length > 150 && (
          <button
            onClick={handleExpand}
            className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 mt-1"
          >
            {isExpanded ? 'Prikaži manje' : 'Pročitaj više'}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium">{current.sender}</span>
          {' • '}
          {current.date}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={!hasPrev}
            className="p-1 rounded hover:bg-amber-200 dark:hover:bg-amber-800 disabled:opacity-30 disabled:cursor-not-allowed text-amber-700 dark:text-amber-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            disabled={!hasNext}
            className="p-1 rounded hover:bg-amber-200 dark:hover:bg-amber-800 disabled:opacity-30 disabled:cursor-not-allowed text-amber-700 dark:text-amber-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

export default StickyAnnouncements;
