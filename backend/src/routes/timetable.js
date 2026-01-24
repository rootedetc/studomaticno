import express from 'express';
import * as cheerio from 'cheerio';
import { generateRequestId, log } from '../services/eduneta.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const lastViewState = new Map();

function parseTimetable(html, requestId = 'unknown') {
  const rid = requestId || generateRequestId();
  log('info', rid, 'Parsing timetable HTML');

  const $ = cheerio.load(html);
  const timetable = [];

  const weekStart = $('#puiTjedanPocetak').text().trim();
  const weekEnd = $('#puiTjedanKraj').text().trim();
  const message = $('#puiPorukaRaspored').text().trim();
  const ispitiMessage = $('#puiPorukaIspiti').text().trim();

  log('debug', rid, 'Week range extracted', { weekStart, weekEnd, message, ispitiMessage });

  if (message && message.includes('nemate nastavu')) {
    log('info', rid, 'No regular classes this week, checking for exams');
  }

  const allDayHeaders = [];
  const dataRows = [];

  const rasporedTable = $('table.raspored');

  if (rasporedTable.length > 0) {
    log('debug', rid, 'Found table.raspored');

    const rows = rasporedTable.find('> tbody > tr');

    rows.each((rowIndex, row) => {
      const $row = $(row);

      const headerCells = $row.find('> td.header');
      if (headerCells.length > 0) {
        headerCells.each((i, cell) => {
          const headerText = $(cell).text().trim();
          if (headerText) {
            allDayHeaders.push(headerText);
            log('debug', rid, `Day header ${i}: ${headerText}`);
          }
        });
        return;
      }

      const dataCells = $row.find('> td[valign="top"]');
      if (dataCells.length > 0) {
        log('debug', rid, `Row ${rowIndex} has ${dataCells.length} data cells`);
        dataRows.push(dataCells);
      }
    });
  } else {
    log('warn', rid, 'No table.raspored found');
  }

  log('debug', rid, 'Headers and rows extracted', {
    dayHeaderCount: allDayHeaders.length,
    dataRowCount: dataRows.length
  });

  let dayIndex = 0;
  let totalLessons = 0;

  dataRows.forEach((dataCells, rowIndex) => {
    dataCells.each((cellIndex, cell) => {
      const dayLessons = [];
      const dayName = allDayHeaders[dayIndex] || `Dan ${dayIndex + 1}`;

      log('debug', rid, `Processing day ${dayIndex} (${dayName})`);

      const lessonTables = $(cell).find('> table > tbody > tr');
      lessonTables.each((lessonIndex, lessonRow) => {
        const cols = $(lessonRow).find('td');
        if (cols.length >= 2) {
          const leftCol = $(cols[0]).text().trim().split('\n').map(s => s.trim()).filter(s => s);
          const rightCol = $(cols[1]);

          const professor = rightCol.clone().find('strong').remove().end().text().trim().split('\n').map(s => s.trim()).filter(s => s)[0] || '';
          const subject = rightCol.find('strong').text().trim().replace(/\*/g, '') || '';
          const type = rightCol.find('small').text().trim() || '';
          const classInfo = rightCol.clone().find('strong, small').remove().end().text().trim().split('\n').map(s => s.trim()).filter(s => s)[0] || '';

          log('debug', rid, `Lesson ${lessonIndex}`, {
            date: leftCol[0], time: leftCol[1], room: leftCol[2],
            professor, subject, type, classInfo
          });

          if (subject || leftCol[1]) {
            const lesson = {
              day: dayName,
              date: leftCol[0] || '',
              time: leftCol[1] || '',
              room: leftCol[2] || '',
              professor,
              subject,
              type,
              class: classInfo
            };

            dayLessons.push(lesson);
            totalLessons++;
          }
        }
      });

      log('debug', rid, `Day ${dayName} has ${dayLessons.length} lessons`);

      if (dayLessons.length > 0) {
        timetable.push({
          day: dayName,
          lessons: dayLessons
        });
      }
      dayIndex++;
    });
  });

  const ispitiTable = $('#puiIspiti').find('table');
  if (ispitiTable.length > 0) {
    log('debug', rid, 'Found #puiIspiti table, parsing exams');

    const ispitiRows = ispitiTable.find('> tbody > tr');
    let examCount = 0;

    const croatianDays = {
      'Monday': 'Ponedjeljak', 'Tuesday': 'Utorak', 'Wednesday': 'Srijeda',
      'Thursday': 'Četvrtak', 'Friday': 'Petak', 'Saturday': 'Subota', 'Sunday': 'Nedjelja'
    };

    ispitiRows.each((rowIndex, row) => {
      const $row = $(row);
      const cells = $row.find('td');

      if (cells.length >= 5 && !cells.eq(0).hasClass('header')) {
        const subject = cells.eq(0).text().trim();
        const professor = cells.eq(1).text().trim();
        const dateStr = cells.eq(2).text().trim();
        const time = cells.eq(3).text().trim();
        const room = cells.eq(4).text().trim();

        if (subject && dateStr && time) {
          const dateParts = dateStr.match(/(\d+)\.(\d+)\.(\d+)\./);
          if (dateParts) {
            const day = parseInt(dateParts[1]);
            const month = parseInt(dateParts[2]) - 1;
            const year = parseInt(dateParts[3]);
            const dateObj = new Date(year, month, day);
            const englishDay = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const croatianDayName = croatianDays[englishDay] || englishDay;

            let dayEntry = timetable.find(d => d.day === croatianDayName);
            if (!dayEntry) {
              dayEntry = { day: croatianDayName, lessons: [] };
              timetable.push(dayEntry);
            }

            const lesson = {
              day: croatianDayName,
              date: dateStr,
              time: time,
              room: room,
              professor: professor,
              subject: subject,
              type: 'ispit'
            };

            dayEntry.lessons.push(lesson);
            examCount++;
            totalLessons++;

            log('debug', rid, `Exam ${examCount}`, { subject, date: dateStr, day: croatianDayName, time, room });
          }
        }
      }
    });

    log('info', rid, `Parsed ${examCount} exams from #puiIspiti`);
  }

  if (timetable.length === 0 && !hasExams(ispitiMessage)) {
    log('info', rid, 'No classes or exams this week');
    return {
      weekStart,
      weekEnd,
      message: message || ispitiMessage,
      timetable: [],
      parsedAt: new Date().toISOString(),
      debug: { note: 'No classes or exams scheduled' }
    };
  }

  const result = {
    weekStart,
    weekEnd,
    timetable,
    parsedAt: new Date().toISOString(),
    debug: {
      dayHeaders: allDayHeaders,
      totalLessons,
      dataRowsCount: dataRows.length
    }
  };

  log('info', rid, 'Timetable parsing complete', {
    weekStart,
    weekEnd,
    daysCount: timetable.length,
    totalLessons
  });

  return result;
}

function hasExams(ispitiMessage) {
  return ispitiMessage && !ispitiMessage.includes('nemate ispitnih rokova');
}

router.post('/navigate', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  const sessionId = req.sessionID;
  log('info', requestId, 'Timetable navigation START', {
    action: req.body.action,
    sessionId: sessionId?.substring(0, 8) + '...',
    timestamp: new Date().toISOString()
  });

  try {
    const { action, date } = req.body;
    const postBackId = action === 'prev' ? 'ctl00$contentBody$puiPrethodni' : 'ctl00$contentBody$puiSljedeci';

    let viewState, eventValidation, viewStateGenerator, currentDate, $;

    if (lastViewState.has(sessionId)) {
      log('debug', requestId, 'Using cached viewstate from previous navigation');
      const cached = lastViewState.get(sessionId);
      viewState = cached.viewState;
      eventValidation = cached.eventValidation;
      viewStateGenerator = cached.viewStateGenerator;
      currentDate = cached.currentDate;
    } else {
      log('debug', requestId, 'Fetching current page first');
      const homeHtml = await req.edunetaService.getPage('/lib-student/raspored.aspx', requestId);
      $ = cheerio.load(homeHtml);

      viewState = $('input[name="__VIEWSTATE"]').val();
      eventValidation = $('input[name="__EVENTVALIDATION"]').val();
      viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val();
      currentDate = $('input[name="ctl00$contentBody$puiDatum"]').val() || '';
    }

    log('debug', requestId, 'Submitting navigation form', {
      postBackId,
      currentDate,
      formDataLength: 1,
      hasViewState: !!viewState
    });

    const formData = new URLSearchParams();
    formData.append('__VIEWSTATE', viewState || '');
    formData.append('__VIEWSTATEGENERATOR', viewStateGenerator || '');
    formData.append('__EVENTVALIDATION', eventValidation || '');
    formData.append('__EVENTTARGET', postBackId);
    formData.append('__EVENTARGUMENT', '');
    formData.append('ctl00$contentBody$puiDatum', currentDate);

    const responseHtml = await req.edunetaService.postFormData('/lib-student/raspored.aspx', formData.toString(), requestId);

    log('info', requestId, 'Raw response preview', {
      first500: responseHtml.substring(0, 500)
    });

    const response$ = cheerio.load(responseHtml);
    const newViewState = response$('input[name="__VIEWSTATE"]').val();
    const newEventValidation = response$('input[name="__EVENTVALIDATION"]').val();
    const newViewStateGenerator = response$('input[name="__VIEWSTATEGENERATOR"]').val();
    const newCurrentDate = response$('input[name="ctl00$contentBody$puiDatum"]').val() || '';

    const responseWeekStart = response$('#puiTjedanPocetak').text().trim();
    const responseWeekEnd = response$('#puiTjedanKraj').text().trim();

    log('info', requestId, 'Navigation response received', {
      responseWeekStart,
      responseWeekEnd,
      htmlLength: responseHtml.length,
      hasRaspored: response$('table.raspored').length > 0,
      hasForm: response$('#form1').length > 0,
      hasNewViewState: !!newViewState
    });

    lastViewState.set(sessionId, {
      viewState: newViewState,
      eventValidation: newEventValidation,
      viewStateGenerator: newViewStateGenerator,
      currentDate: newCurrentDate
    });

    log('debug', requestId, 'Cached new viewstate for session', { sessionId: sessionId?.substring(0, 8) + '...' });

    const result = parseTimetable(responseHtml, requestId);

    log('info', requestId, 'Navigation COMPLETE', {
      newWeekStart: result.weekStart,
      newWeekEnd: result.weekEnd,
      daysCount: result.timetable?.length || 0
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    log('error', requestId, `Navigation error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to navigate timetable' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  const sessionId = req.sessionID;
  log('info', requestId, 'Fetching timetable');

  try {
    const html = await req.edunetaService.getPage('/lib-student/raspored.aspx', requestId);
    const result = parseTimetable(html, requestId);

    const $ = cheerio.load(html);
    const viewState = $('input[name="__VIEWSTATE"]').val();
    const eventValidation = $('input[name="__EVENTVALIDATION"]').val();
    const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val();
    const currentDate = $('input[name="ctl00$contentBody$puiDatum"]').val() || '';

    lastViewState.set(sessionId, {
      viewState,
      eventValidation,
      viewStateGenerator,
      currentDate
    });

    log('debug', requestId, 'Cached initial viewstate for session', { sessionId: sessionId?.substring(0, 8) + '...' });

    res.json({
      success: true,
      ...result,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    log('error', requestId, `Fetch error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

router.get('/today', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Fetching today timetable');

  try {
    const html = await req.edunetaService.getPage('/lib-student/raspored.aspx', requestId);
    const result = parseTimetable(html, requestId);

    const today = new Date().toLocaleDateString('hr-HR', { weekday: 'long' });
    const croatianDays = {
      'Monday': 'Ponedjeljak',
      'Tuesday': 'Utorak',
      'Wednesday': 'Srijeda',
      'Thursday': 'Četvrtak',
      'Friday': 'Petak',
      'Saturday': 'Subota',
      'Sunday': 'Nedjelja'
    };
    const croatianToday = croatianDays[today] || today;

    const todayLessons = result.timetable.find(t =>
      t.day.toLowerCase() === croatianToday.toLowerCase()
    );

    log('debug', requestId, `Today: ${croatianToday}`, {
      found: !!todayLessons,
      lessonsCount: todayLessons?.lessons?.length || 0
    });

    res.json({
      success: true,
      day: croatianToday,
      lessons: todayLessons?.lessons || []
    });
  } catch (error) {
    log('error', requestId, `Today fetch error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch today timetable' });
  }
});

router.get('/weekly', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Fetching weekly timetable', { date: req.query.date });

  try {
    const { date } = req.query;
    let url = '/lib-student/raspored.aspx';

    if (date) {
      url += `?date=${date}`;
    }

    const html = await req.edunetaService.getPage(url, requestId);
    const result = parseTimetable(html, requestId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    log('error', requestId, `Weekly fetch error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch weekly timetable' });
  }
});

router.post('/set-date', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Setting timetable date', { date: req.body.date });

  try {
    const { date } = req.body;

    const homeHtml = await req.edunetaService.getPage('/lib-student/raspored.aspx', requestId);
    const $ = cheerio.load(homeHtml);

    const viewState = $('input[name="__VIEWSTATE"]').val();
    const eventValidation = $('input[name="__EVENTVALIDATION"]').val();
    const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val();

    const formData = new URLSearchParams();
    formData.append('__VIEWSTATE', viewState || '');
    formData.append('__VIEWSTATEGENERATOR', viewStateGenerator || '');
    formData.append('__EVENTVALIDATION', eventValidation || '');
    formData.append('__EVENTTARGET', '');
    formData.append('__EVENTARGUMENT', '');
    formData.append('ctl00$contentBody$puiDatum', date);

    log('debug', requestId, 'Submitting date change form', { date, formDataLength: formData.toString().length });

    const responseHtml = await req.edunetaService.postFormData('/lib-student/raspored.aspx', formData.toString(), requestId);
    const result = parseTimetable(responseHtml, requestId);

    log('info', requestId, 'Date change complete', {
      requestedDate: date,
      newWeekStart: result.weekStart,
      newWeekEnd: result.weekEnd,
      daysCount: result.timetable?.length || 0
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    log('error', requestId, `Date set error: ${error.message}`);
    res.status(500).json({ error: 'Failed to set date' });
  }
});

export default router;
