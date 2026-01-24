import express from 'express';
import * as cheerio from 'cheerio';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const html = await req.edunetaService.getPage('/lib-student/IzvRedovitost.aspx');
    const $ = cheerio.load(html);

    const regularity = [];
    $('#dgRedovitost tr').not('.trHead').each((i, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 5) {
        regularity.push({
          month: $(cols[0]).text().trim(),
          year: $(cols[1]).text().trim(),
          status: $(cols[2]).text().trim(),
          date: $(cols[3]).text().trim(),
          notes: $(cols[4]).text().trim()
        });
      }
    });

    res.json({
      success: true,
      regularity,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Regularity fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch regularity data' });
  }
});

export default router;
