import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

function BottomSheet({ isOpen, onClose, title, children }) {
    const sheetRef = useRef(null);
    const previousActiveElement = useRef(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartY = useRef(0);
    const contentScrollTop = useRef(0);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            previousActiveElement.current = document.activeElement;
            document.body.style.overflow = 'hidden';
            // Trigger animation after render
            requestAnimationFrame(() => {
                setIsAnimating(true);
                sheetRef.current?.focus();
            });
        } else {
            setIsAnimating(false);
            setDragOffset(0); // Reset drag offset
            document.body.style.overflow = 'unset';
            // Wait for animation to complete before unmounting
            const timer = setTimeout(() => {
                setShouldRender(false);
                previousActiveElement.current?.focus();
            }, 300);
            return () => clearTimeout(timer);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
        // Check if content is scrolled to top
        const contentElement = sheetRef.current?.querySelector('.overflow-y-auto');
        contentScrollTop.current = contentElement ? contentElement.scrollTop : 0;
        setIsDragging(true);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY.current;

        // Only allow dragging down if content is at the top
        if (contentScrollTop.current === 0 && deltaY > 0) {
            // Add resistance
            setDragOffset(deltaY);
            // Prevent default scrolling only if we are dragging the sheet
            if (e.cancelable) e.preventDefault();
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);

        // Threshold to close
        if (dragOffset > 150) {
            onClose();
        } else {
            // Snap back
            setDragOffset(0);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            const focusableElements = sheetRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements?.length) {
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    };

    if (!isOpen && !shouldRender) return null;

    return createPortal(
        <div
            className={`fixed inset-0 z-50 flex items-end justify-center transition-colors duration-300 ${isAnimating ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'
                }`}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'bottomsheet-title' : undefined}
        >
            <div
                ref={sheetRef}
                className={`
          bg-white dark:bg-gray-800 
          w-full max-w-2xl 
          rounded-t-2xl 
          shadow-2xl 
          max-h-[90vh] 
          flex flex-col
          focus:outline-none
          transition-transform duration-300 ease-out
        `}
                style={{
                    transform: isDragging
                        ? `translateY(${dragOffset}px)`
                        : isAnimating && !dragOffset
                            ? 'translateY(0)'
                            : 'translateY(100%)',
                    transition: isDragging ? 'none' : undefined
                }}
                onKeyDown={handleKeyDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                tabIndex="-1"
            >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-4 pb-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 id="bottomsheet-title" className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1 mr-4">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        aria-label="Zatvori"
                    >
                        <Icon name="close" className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default BottomSheet;
