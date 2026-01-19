import express from 'express';
import * as cheerio from 'cheerio';
import edunetaService from '../services/eduneta.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const html = await edunetaService.getPage('/lib-student/IzvPlaceneRate.aspx');
    const $ = cheerio.load(html);

    const payments = [];
    $('#dgRate tr').not('.trHead').each((i, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 6) {
        payments.push({
          installmentNumber: $(cols[0]).text().trim(),
          amount: $(cols[1]).text().trim(),
          paymentDate: $(cols[2]).text().trim(),
          dueDate: $(cols[3]).text().trim(),
          status: $(cols[4]).text().trim(),
          method: $(cols[5]).text().trim()
        });
      }
    });

    const totalPaid = payments
      .filter(p => p.status.toLowerCase().includes('plaćeno') || p.status.toLowerCase().includes('uplaćeno'))
      .reduce((sum, p) => {
        const amount = parseFloat(p.amount.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        return sum + amount;
      }, 0);

    const totalDue = payments.reduce((sum, p) => {
      const amount = parseFloat(p.amount.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      return sum + amount;
    }, 0);

    res.json({
      success: true,
      payments,
      summary: {
        totalInstallments: payments.length,
        totalPaid,
        totalDue,
        pending: totalDue - totalPaid
      },
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Payments fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

export default router;
