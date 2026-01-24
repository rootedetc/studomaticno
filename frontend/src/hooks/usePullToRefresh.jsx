import { useState, useRef, useCallback, useEffect } from 'react';

const PULL_THRESHOLD = 100;
const MAX_PULL_DISTANCE = 150;

export function usePullToRefresh(onRefresh) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const handleStart = useCallback((y) => {
    if (isRefreshing) return;
    const container = containerRef.current;
    if (!container) return;
    if (container.scrollTop > 0) return;
    isDragging.current = true;
    startY.current = y;
    currentY.current = y;
  }, [isRefreshing]);

  const handleMove = useCallback((y) => {
    if (!isDragging.current || isRefreshing) return;
    const delta = y - startY.current;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }
    const distance = Math.min(delta, MAX_PULL_DISTANCE);
    setPullDistance(distance);
    currentY.current = y;
  }, [isRefreshing]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      onRefresh().finally(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => handleStart(e.touches[0].clientY);
    const handleTouchMove = (e) => handleMove(e.touches[0].clientY);
    const handleTouchEnd = () => handleEnd();

    const handleMouseDown = (e) => handleStart(e.clientY);
    const handleMouseMove = (e) => handleMove(e.clientY);
    const handleMouseUp = () => handleEnd();
    const handleMouseLeave = () => {
      if (isDragging.current) {
        handleEnd();
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleStart, handleMove, handleEnd]);

  const triggerRefresh = useCallback(() => {
    if (!isRefreshing) {
      setIsRefreshing(true);
      onRefresh().finally(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      });
    }
  }, [isRefreshing, onRefresh]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    triggerRefresh,
    pullProgress: Math.min(pullDistance / PULL_THRESHOLD, 1),
  };
}

export function PullIndicator({ isRefreshing, pullProgress }) {
  const rotation = pullProgress * 180;

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden pointer-events-none transition-all duration-200"
      style={{
        height: isRefreshing ? 60 : pullProgress * 60,
        opacity: pullProgress > 0 || isRefreshing ? 1 : 0,
        transform: `translateY(${-60 + (isRefreshing ? 60 : pullProgress * 60)}px)`,
      }}
    >
      <div className="flex items-center justify-center">
        {isRefreshing ? (
          <svg className="w-6 h-6 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg
            className="w-6 h-6 text-primary-600 transition-transform duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
      </div>
    </div>
  );
}

export default usePullToRefresh;
