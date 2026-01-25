import { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

/**
 * AddToCalendar component - Shows a popup with options to add event to Apple Calendar or Google Calendar
 * 
 * Props:
 * - lesson: { subject, professor, room, time, date, type }
 * - onClose: callback when popup closes
 */
export default function AddToCalendar({ lesson, onClose }) {
    const popupRef = useRef(null);
    const [showSuccess, setShowSuccess] = useState(null);

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                onClose?.();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Parse the lesson date and time to create start/end DateTime
    const parseDateTime = () => {
        // lesson.date is like "24. 1. 2026." or "24.1.2026."
        // lesson.time is like "08:00 - 09:30" or "08:00-09:30"

        const dateStr = lesson.date?.replace(/\s+/g, '').replace(/\.$/g, '') || '';
        const dateParts = dateStr.split('.');

        if (dateParts.length < 3) {
            // Fallback to current date
            const now = new Date();
            return {
                start: now,
                end: new Date(now.getTime() + 90 * 60 * 1000) // 90 minutes later
            };
        }

        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
        const year = parseInt(dateParts[2], 10);

        // Parse time
        const timeStr = lesson.time || '09:00 - 10:30';
        const timeParts = timeStr.split(/\s*-\s*/);

        const parseTime = (t) => {
            const [h, m] = t.split(':').map(Number);
            return { hours: h || 9, minutes: m || 0 };
        };

        const startTime = parseTime(timeParts[0] || '09:00');
        const endTime = parseTime(timeParts[1] || '10:30');

        const start = new Date(year, month, day, startTime.hours, startTime.minutes);
        const end = new Date(year, month, day, endTime.hours, endTime.minutes);

        return { start, end };
    };

    // Format date for ICS file (YYYYMMDDTHHMMSS)
    const formatICSDate = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
    };

    // Generate ICS file content
    const generateICS = () => {
        const { start, end } = parseDateTime();
        const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@studomaticno`;
        const now = new Date();

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//studomaticno//HR',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${formatICSDate(now)}`,
            `DTSTART:${formatICSDate(start)}`,
            `DTEND:${formatICSDate(end)}`,
            `SUMMARY:${lesson.subject || 'Predavanje'}`,
            `DESCRIPTION:${lesson.professor || ''} - ${lesson.type || 'Predavanje'}`,
            `LOCATION:${lesson.room || ''}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        return icsContent;
    };

    // Download ICS file for Apple Calendar or share on mobile
    const handleAppleCalendar = async () => {
        const icsContent = generateICS();
        const file = new File([icsContent], `${lesson.subject || 'event'}.ics`, { type: 'text/calendar' });

        // Try native sharing first (works best on iOS/Android PWAs)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: lesson.subject || 'Predavanje',
                    text: `Kalendar export za ${lesson.subject}`
                });
                setShowSuccess('apple');
                setTimeout(() => onClose?.(), 1500);
                return;
            } catch (err) {
                console.log('Share failed or cancelled:', err);
                if (err.name !== 'AbortError') {
                    // If share failed (not cancelled), fall back to download
                } else {
                    return; // User cancelled
                }
            }
        }

        // Fallback to blob download
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${lesson.subject || 'event'}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setShowSuccess('apple');
        setTimeout(() => onClose?.(), 1500);
    };

    // Open Google Calendar with pre-filled event
    const handleGoogleCalendar = () => {
        const { start, end } = parseDateTime();

        // Google Calendar date format: YYYYMMDDTHHMMSS
        const formatGoogleDate = (date) => {
            const pad = (n) => n.toString().padStart(2, '0');
            return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
        };

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: lesson.subject || 'Predavanje',
            dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
            details: `${lesson.professor || ''} - ${lesson.type || 'Predavanje'}`,
            location: lesson.room || ''
        });

        const googleUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
        window.open(googleUrl, '_blank');

        setShowSuccess('google');
        setTimeout(() => onClose?.(), 1500);
    };

    return (
        <>
            {/* Backdrop for mobile to close when clicking outside */}
            <div className="fixed inset-0 z-40 sm:hidden" onClick={onClose}></div>

            <div
                ref={popupRef}
                className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[220px] animate-in fade-in slide-in-from-top-2 origin-top-right sm:w-auto w-[200px]"
                style={{
                    // Ensure it doesn't go off-screen on the right
                    right: '0px',
                    maxWidth: '90vw'
                }}
            >
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Dodaj u kalendar</p>
                </div>

                {showSuccess ? (
                    <div className="p-4 flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                        <Icon name="checkCircle" size={20} />
                        <span className="text-sm">Dodano!</span>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        <button
                            onClick={handleAppleCalendar}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                            <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center shrink-0">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white dark:text-gray-900" fill="currentColor">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Apple / System</span>
                        </button>

                        <button
                            onClick={handleGoogleCalendar}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                            <div className="w-8 h-8 bg-white border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center shrink-0">
                                <svg viewBox="0 0 24 24" className="w-5 h-5">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Google Calendar</span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
