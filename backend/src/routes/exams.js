import express from 'express';
import * as cheerio from 'cheerio';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const html = await req.edunetaService.getPage('/lib-student/IzvPrijavljeniIspiti.aspx');
    const $ = cheerio.load(html);

    const parseExams = ($doc) => {
      const prijavljeni = [];
      $doc('#dgPrijavio tr').not('.trHead').each((i, row) => {
        const cols = $doc(row).find('td');
        if (cols.length >= 7) {
          prijavljeni.push({
            year: $doc(cols[0]).text().trim(),
            subject: $doc(cols[1]).text().trim(),
            professor: $doc(cols[2]).text().trim(),
            examDate: $doc(cols[3]).text().trim(),
            room: $doc(cols[4]).text().trim(),
            enrollmentDate: $doc(cols[5]).text().trim(),
            grade: $doc(cols[6]).text().trim()
          });
        }
      });

      const odjavljeni = [];
      $doc('#dgOdjavio tr').not('.trHead').each((i, row) => {
        const cols = $doc(row).find('td');
        if (cols.length >= 6) {
          odjavljeni.push({
            year: $doc(cols[0]).text().trim(),
            subject: $doc(cols[1]).text().trim(),
            professor: $doc(cols[2]).text().trim(),
            examDate: $doc(cols[3]).text().trim(),
            room: $doc(cols[4]).text().trim(),
            cancellationDate: $doc(cols[5]).text().trim()
          });
        }
      });

      return { prijavljeni, odjavljeni };
    };

    const selectedSessionValue = $('#lstRok option:selected').val();
    const isSessionSelected = selectedSessionValue && selectedSessionValue !== '0|0';

    let allPrijavljeni = [];
    let allOdjavljeni = [];
    let examPeriods = [];

    if (isSessionSelected) {
      const { prijavljeni, odjavljeni } = parseExams($);
      allPrijavljeni = prijavljeni;
      allOdjavljeni = odjavljeni;
      examPeriods.push($('#lstRok option:selected').text().trim());
    } else {
      const sessions = [];
      $('#lstRok option').each((i, el) => {
        const val = $(el).val();
        const text = $(el).text().trim();
        if (val && val !== '0|0') {
          sessions.push({ val, text });
        }
      });

      if (sessions.length > 0) {
        const viewState = $('input[name="__VIEWSTATE"]').val();
        const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val();
        const eventValidation = $('input[name="__EVENTVALIDATION"]').val();
        const academicYearVal = $('#lstAkadGod option:selected').val();

        const results = await Promise.all(sessions.map(async (session) => {
          const formData = new URLSearchParams();
          formData.append('__VIEWSTATE', viewState || '');
          formData.append('__VIEWSTATEGENERATOR', viewStateGenerator || '');
          formData.append('__EVENTVALIDATION', eventValidation || '');
          formData.append('ctl00$contentBody$lstAkadGod', academicYearVal);
          formData.append('ctl00$contentBody$lstRok', session.val);
          formData.append('__EVENTTARGET', 'ctl00$contentBody$lstRok');
          formData.append('__EVENTARGUMENT', '');

          try {
            const sessionHtml = await req.edunetaService.postFormData('/lib-student/IzvPrijavljeniIspiti.aspx', formData.toString());
            const $session = cheerio.load(sessionHtml);
            return {
              ...parseExams($session),
              periodName: session.text
            };
          } catch (err) {
            console.error(`Failed to fetch session ${session.text}:`, err);
            return null;
          }
        }));

        results.filter(r => r).forEach(result => {
          allPrijavljeni = [...allPrijavljeni, ...result.prijavljeni];
          allOdjavljeni = [...allOdjavljeni, ...result.odjavljeni];
          examPeriods.push(result.periodName);
        });
      }
    }

    const uniquePrijavljeni = Array.from(new Set(allPrijavljeni.map(JSON.stringify))).map(JSON.parse);
    const uniqueOdjavljeni = Array.from(new Set(allOdjavljeni.map(JSON.stringify))).map(JSON.parse);

    const academicYear = $('#lstAkadGod option:selected').text().trim();
    const examPeriod = examPeriods.join(', ') || 'Nije odabran rok';

    res.json({
      success: true,
      academicYear,
      examPeriod,
      prijavljeni: uniquePrijavljeni,
      odjavljeni: uniqueOdjavljeni,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Exams fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

router.get('/attempts', requireAuth, async (req, res) => {
  try {
    const { idOS, idPred, idAKG } = req.query;

    if (!idOS || !idPred || !idAKG) {
      return res.status(400).json({ error: 'Missing required parameters: idOS, idPred, idAKG' });
    }

    const html = await req.edunetaService.getPage(`/lib-student/IzvIzlasciIspit.aspx?idOS=${idOS}&idPred=${idPred}&idAKG=${idAKG}`);
    const $ = cheerio.load(html);

    const subject = $('#labPredmet').text().trim();
    const attempts = [];

    $('#dg tr').not('.trHead').each((i, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 9) {
        const attemptNumber = $(cols[0]).find('#labBrIzlaska').text().trim();
        attempts.push({
          attemptNumber: attemptNumber || (i + 1).toString(),
          examPeriod: $(cols[1]).text().trim(),
          registered: $(cols[2]).find('#imgPrijavljen').length > 0,
          examDate: $(cols[3]).text().trim(),
          professor: $(cols[4]).text().trim(),
          enrollmentTime: $(cols[5]).text().trim(),
          cancellationTime: $(cols[6]).text().trim(),
          grade: $(cols[7]).text().trim(),
          year: $(cols[8]).text().trim()
        });
      }
    });

    res.json({
      success: true,
      subject,
      attempts,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Exam attempts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch exam attempts' });
  }
});

export default router;
