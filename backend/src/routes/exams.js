import express from 'express';
import * as cheerio from 'cheerio';
import edunetaService from '../services/eduneta.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const html = await edunetaService.getPage('/lib-student/IzvPrijavljeniIspiti.aspx');
    const $ = cheerio.load(html);

    const prijavljeni = [];
    $('#dgPrijavio tr').not('.trHead').each((i, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 7) {
        prijavljeni.push({
          year: $(cols[0]).text().trim(),
          subject: $(cols[1]).text().trim(),
          professor: $(cols[2]).text().trim(),
          examDate: $(cols[3]).text().trim(),
          room: $(cols[4]).text().trim(),
          enrollmentDate: $(cols[5]).text().trim(),
          grade: $(cols[6]).text().trim()
        });
      }
    });

    const odjavljeni = [];
    $('#dgOdjavio tr').not('.trHead').each((i, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 6) {
        odjavljeni.push({
          year: $(cols[0]).text().trim(),
          subject: $(cols[1]).text().trim(),
          professor: $(cols[2]).text().trim(),
          examDate: $(cols[3]).text().trim(),
          room: $(cols[4]).text().trim(),
          cancellationDate: $(cols[5]).text().trim()
        });
      }
    });

    const academicYear = $('#lstAkadGod option:selected').text().trim();
    const examPeriod = $('#lstRok option:selected').text().trim();

    res.json({
      success: true,
      academicYear,
      examPeriod,
      prijavljeni,
      odjavljeni,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Exams fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

export default router;
