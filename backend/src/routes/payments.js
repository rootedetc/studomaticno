import express from 'express';
import * as cheerio from 'cheerio';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const html = await req.edunetaService.getPage('/lib-student/IzvPlaceneRate.aspx');
    const $ = cheerio.load(html);

    const currentBalance = $('#labStanje').text().trim();
    const currentZone = $('#labZona').text().trim();

    const transactions = [];
    $('#dgFin tr').not('.trHead').each((i, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 6) {
        const date = $(cols[0]).text().trim();
        const name = $(cols[1]).text().trim();
        const description = $(cols[2]).text().trim();
        const payment = $(cols[3]).text().trim();
        const debt = $(cols[4]).text().trim();
        const balance = $(cols[5]).text().trim();

        transactions.push({
          date,
          name,
          description,
          payment,
          debt,
          balance
        });
      }
    });

    const totalPayments = transactions.reduce((sum, t) => {
      const amount = parseFloat(t.payment.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      return sum + amount;
    }, 0);

    const totalDebt = transactions.reduce((sum, t) => {
      const amount = parseFloat(t.debt.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      return sum + amount;
    }, 0);

    res.json({
      success: true,
      transactions,
      summary: {
        currentBalance,
        currentZone,
        totalPayments,
        totalDebt,
        transactionCount: transactions.length
      },
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Payments fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

export default router;
