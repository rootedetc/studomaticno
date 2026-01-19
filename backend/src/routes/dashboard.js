import express from 'express';
import * as cheerio from 'cheerio';
import edunetaService from '../services/eduneta.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', requireAuth, async (req, res) => {
  try {
    const homeHtml = await edunetaService.getPage('/lib-student/Default.aspx');
    const $ = cheerio.load(homeHtml);

    const userInfo = {
      name: $('#labKorisnik').text().trim() || '',
      program: $('#labProgram').text().trim() || '',
      semester: $('#labAkadGodSem').text().trim() || '',
      date: $('#labDatum').text().trim() || ''
    };

    const hasNoObav = $('#divNemaObav').text().trim().includes('Nema nepročitanih obavijesti');
    const hasNoPoruka = $('#divNemaPoruka').text().trim().includes('Nema nepročitanih poruka');
    const unreadNotifications = hasNoObav ? 0 : 1;
    const unreadMessages = hasNoPoruka ? 0 : 1;

    const quickLinks = [];
    $('#dgPrecaci a[id*="lnkPrecac"]').each((i, link) => {
      const href = $(link).attr('href');
      const title = $(link).attr('title') || $(link).text().trim();
      if (href && title) {
        quickLinks.push({
          title,
          url: href
        });
      }
    });

    const recentFiles = [];
    $('#dgDatoteke a[id*="lnkDatoteka"]').each((i, link) => {
      if (i >= 5) return;
      const href = $(link).attr('href');
      const title = $(link).text().trim();
      if (href && title) {
        recentFiles.push({
          name: title,
          url: href,
          date: '',
          size: ''
        });
      }
    });

    res.json({
      userInfo,
      unreadNotifications,
      unreadMessages,
      newMessages: unreadMessages,
      recentFiles,
      quickLinks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.get('/user', requireAuth, async (req, res) => {
  try {
    const homeHtml = await edunetaService.getPage('/lib-student/Default.aspx');
    const $ = cheerio.load(homeHtml);

    res.json({
      user: {
        name: $('#labKorisnik').text().trim(),
        program: $('#labProgram').text().trim(),
        semester: $('#labAkadGodSem').text().trim(),
        date: $('#labDatum').text().trim()
      }
    });
  } catch (error) {
    console.error('User info fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

export default router;
