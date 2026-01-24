import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

function BottomSheet({ isOpen, onClose, title, children }) {
    const sheetRef = useRef(null);
    const previousActiveElement = useRef(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

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

    if (!shouldRender) return null;

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
          ${isAnimating ? 'translate-y-0' : 'translate-y-full'}
        `}
                onKeyDown={handleKeyDown}
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
