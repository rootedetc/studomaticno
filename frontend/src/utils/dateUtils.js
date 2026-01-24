/**
 * Date utility functions for the Timetable Week Ribbon component.
 * Handles date manipulation and formatting for Croatian locale.
 */

const LOCALE = 'hr-HR';

/**
 * Returns an array of 7 dates representing the week containing the given date.
 * Weeks start on Monday.
 * @param {Date} date - The date to get the week for
 * @returns {Date[]} Array of 7 Date objects (Mon-Sun)
 */
export const getWeekDays = (date) => {
    const current = new Date(date);
    // Adjust to get Monday (1) of the current week
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    const day = current.getDay();
    // Calculate difference to get to Monday. 
    // If it's Sunday (0), we need to go back 6 days.
    // If it's Monday (1), diff is 0.
    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(current);
    monday.setDate(current.getDate() + diff);

    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        week.push(d);
    }
    return week;
};

/**
 * Adds n weeks to the given date and returns a new Date object.
 * @param {Date} date - Base date
 * @param {number} n - Number of weeks to add (can be negative)
 * @returns {Date} New date
 */
export const addWeeks = (date, n) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + (n * 7));
    return newDate;
};

/**
 * Returns an array of Date objects for all days in the specified month.
 * Also includes padding days from previous/next months to complete the weeks
 * if needed for a grid view (optional, but good for calendars).
 * @param {number} year - The year
 * @param {number} month - The month (0-11)
 * @returns {Date[]} Array of Date objects
 */
export const getMonthDays = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];

    // Get the first day of the week for the 1st of the month
    // We want to start from the previous Monday if the month doesn't start on Monday
    const dayOfWeek = date.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const startDate = new Date(year, month, 1);
    startDate.setDate(1 + diff);

    // We generally want to show 6 weeks to cover all possibilities (e.g. 1st is Sunday)
    // or just until the end of the month plus padding
    // Let's generate 42 days (6 weeks) to be safe for a consistent grid
    for (let i = 0; i < 42; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push(d);
    }

    return days;
};

/**
 * Checks if two dates refer to the same day.
 * @param {Date} d1 
 * @param {Date} d2 
 * @returns {boolean}
 */
export const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear();
};

/**
 * Check if the date is today
 * @param {Date} date 
 * @returns {boolean}
 */
export const isToday = (date) => {
    return isSameDay(date, new Date());
};

/**
 * Formats a date for display (e.g., "Siječanj 2026")
 * @param {Date} date 
 * @returns {string}
 */
export const formatMonthYear = (date) => {
    const month = date.toLocaleDateString(LOCALE, { month: 'long' });
    const year = date.getFullYear();
    // Capitalize first letter of month
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
};

/**
 * Formats a date to "DD.MM.YYYY." string
 * @param {Date} date 
 * @returns {string}
 */
export const formatFullDate = (date) => {
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    return `${d}. ${m}. ${y}.`;
};

/**
 * Get day name short (e.g. "Pon")
 * @param {Date} date 
 * @returns {string}
 */
export const getDayNameShort = (date) => {
    return date.toLocaleDateString(LOCALE, { weekday: 'short' });
};
