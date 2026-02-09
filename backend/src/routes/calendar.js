import express from 'express';

const router = express.Router();

const monthNames = [
  'siječnja', 'veljače', 'ožujka', 'travnja', 'svibnja', 'lipnja',
  'srpnja', 'kolovoza', 'rujna', 'listopada', 'studenoga', 'prosinca'
];

function parseCroatianDate(dateStr) {
  const clean = dateStr?.replace(/\.$/, '').trim() || '';
  const monthMap = {
    'siječnja': 0, 'siječanj': 0, '1.': 0,
    'veljače': 1, 'veljača': 1, '2.': 1,
    'ožujka': 2, 'ožujak': 2, '3.': 2,
    'travnja': 3, 'travanj': 3, '4.': 3,
    'svibnja': 4, 'svibanj': 4, '5.': 4,
    'lipnja': 5, 'lipanj': 5, '6.': 5,
    'srpnja': 6, 'srpanj': 6, '7.': 6,
    'kolovoza': 7, 'kolovoz': 7, '8.': 7,
    'rujna': 8, 'rujan': 8, '9.': 8,
    'listopada': 9, 'listopad': 9, '10.': 9,
    'studenoga': 10, 'studeni': 10, '11.': 10,
    'prosinca': 11, 'prosinac': 11, '12.': 11
  };

  const parts = clean.split(/[\.\s]+/).filter(p => p);
  if (parts.length < 2) return null;

  const day = parseInt(parts[0], 10);
  let month = -1;
  let year = new Date().getFullYear();

  if (!isNaN(parseInt(parts[1], 10))) {
    month = parseInt(parts[1], 10) - 1;
  } else {
    const monthName = parts[1].toLowerCase();
    Object.keys(monthMap).forEach(key => {
      if (monthName.startsWith(key) || key.startsWith(monthName)) {
        month = monthMap[key];
      }
    });
  }

  if (parts.length >= 3) {
    const parsedYear = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(parsedYear) && parsedYear > 2000) {
      year = parsedYear;
    }
  }

  if (isNaN(day) || month === -1) return null;
  return { day, month, year };
}

function parseTime(timeStr) {
  const parts = timeStr?.split(/\s*-\s*/) || ['09:00', '10:30'];
  const parse = (t) => {
    const [h, m] = t.split(':').map(Number);
    return { hours: h || 9, minutes: m || 0 };
  };
  return {
    start: parse(parts[0] || '09:00'),
    end: parse(parts[1] || '10:30')
  };
}

function formatICSDate(year, month, day, hours, minutes) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${year}${pad(month + 1)}${pad(day)}T${pad(hours)}${pad(minutes)}00`;
}

function escapeICS(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

router.get('/event', (req, res) => {
  const { subject, professor, room, time, date, type } = req.query;

  if (!subject || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields: subject, date, time' });
  }

  const dateParts = parseCroatianDate(date);
  if (!dateParts) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  const timeParts = parseTime(time);
  const { day, month, year } = dateParts;

  const dtStart = formatICSDate(year, month, day, timeParts.start.hours, timeParts.start.minutes);
  const dtEnd = formatICSDate(year, month, day, timeParts.end.hours, timeParts.end.minutes);
  const now = formatICSDate(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
    new Date().getHours(),
    new Date().getMinutes()
  );

  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@studomaticno.app`;
  const filename = `${(subject || 'event').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.ics`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//studomaticno//HR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(subject)}`,
    `DESCRIPTION:${escapeICS(`${professor || ''} - ${type || 'Predavanje'}`)}`,
    `LOCATION:${escapeICS(room || '')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-cache');
  res.send(icsContent);
});

export default router;
