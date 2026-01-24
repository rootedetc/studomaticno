import express from 'express';
import * as cheerio from 'cheerio';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const html = await req.edunetaService.getPage('/lib-student/Indeks.aspx');
    const $ = cheerio.load(html);

    const courses = [];
    $('#dg tr').not('.trHead').each((i, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 10) {
        const link = $(cols[8]).find('a').attr('href');
        const linkMatch = link?.match(/idOS=(\d+)&idPred=(\d+)&idAKG=(\d+)/);

        courses.push({
          rbr: $(cols[0]).text().trim(),
          year: $(cols[1]).text().trim(),
          course: $(cols[2]).text().trim(),
          finalGrade: $(cols[3]).text().trim(),
          secondSignature: $(cols[4]).find('img').length > 0,
          ects: $(cols[5]).text().trim(),
          examAttempts: $(cols[6]).text().trim(),
          examLink: link || null,
          examLinkParams: linkMatch ? {
            idOS: linkMatch[1],
            idPred: linkMatch[2],
            idAKG: linkMatch[3]
          } : null,
          cancellations: $(cols[9]).text().trim(),
          professor: $(cols[10]).text().trim()
        });
      }
    });

    const studyProgram = $('#lstStudij option:selected').text().trim();
    const viewMode = $('#lstVrsta option:selected').text().trim();

    const passed = courses.filter(c => c.finalGrade && c.finalGrade !== '');
    const failed = courses.filter(c => !c.finalGrade || c.finalGrade === '');

    const ectsSum = courses.reduce((sum, c) => {
      const ects = parseInt(c.ects) || 0;
      return sum + ects;
    }, 0);

    const avgGrade = passed.length > 0
      ? passed.reduce((sum, c) => sum + (parseInt(c.finalGrade) || 0), 0) / passed.length
      : 0;

    res.json({
      success: true,
      studyProgram,
      viewMode,
      courses,
      summary: {
        total: courses.length,
        passed: passed.length,
        failed: failed.length,
        ectsTotal: ectsSum,
        averageGrade: avgGrade.toFixed(2)
      },
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Grades fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

export default router;
