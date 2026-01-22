import express from 'express';
import edunetaService from '../services/eduneta.js';
import { singleUserLock } from '../middleware/auth.js';
import { generateRequestId, log } from '../services/eduneta.js';

const router = express.Router();

router.post('/login', singleUserLock, async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Login request received');

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      log('warn', requestId, 'Login failed - missing credentials');
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await edunetaService.login(username, password);

    req.session.user = {
      username,
      userName: result.userName,
      loginTime: new Date().toISOString()
    };
    req.session.edunetaCookies = edunetaService.saveCookiesToSession();
    req.session.cookie.maxAge = 24 * 60 * 60 * 1000;

    log('info', requestId, 'Login successful, processing sticky announcements', { username });

    const stickyAnnouncements = await edunetaService.processStickyAnnouncements(async (announcement) => {
      log('info', requestId, 'Sticky announcement processed', {
        id: announcement.id,
        title: announcement.title?.substring(0, 50)
      });
    }, requestId);

    req.session.stickyAnnouncements = stickyAnnouncements;

    log('info', requestId, 'Login complete', {
      stickyCount: stickyAnnouncements.length
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: { username, name: result.userName },
      stickyAnnouncementsCount: stickyAnnouncements.length
    });
  } catch (error) {
    log('error', requestId, `Login route error: ${error.message}`);
    res.status(401).json({ error: error.message || 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  edunetaService.cookies = {};
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out' });
  });
});

router.get('/status', (req, res) => {
  if (req.session.user) {
    res.json({
      authenticated: true,
      user: { username: req.session.user.username },
      loginTime: req.session.user.loginTime
    });
  } else {
    res.json({ authenticated: false });
  }
});

router.get('/sticky-announcements', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const stickyAnnouncements = req.session.stickyAnnouncements || [];

  res.json({
    success: true,
    stickyAnnouncements,
    count: stickyAnnouncements.length
  });
});

router.post('/refresh-session', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    await edunetaService.checkSession();
    res.json({ success: true, message: 'Session valid' });
  } catch (error) {
    req.session.destroy();
    res.status(401).json({ error: 'Session expired' });
  }
});

export default router;
