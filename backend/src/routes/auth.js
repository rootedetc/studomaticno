import express from 'express';
import serviceManager from '../utils/service-manager.js';
import { EdunetaService, generateRequestId, log } from '../services/eduneta.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Login request received');

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      log('warn', requestId, 'Login failed - missing credentials');
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Create a new service instance for this session
    const edunetaService = serviceManager.getServiceForSession(req.sessionID);

    const result = await edunetaService.login(username, password, requestId);

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

    // Save updated cookies after processing announcements
    req.session.edunetaCookies = edunetaService.saveCookiesToSession();

    log('info', requestId, 'Login complete', {
      stickyCount: stickyAnnouncements.length,
      activeServices: serviceManager.getActiveCount()
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: { username, name: result.userName },
      stickyAnnouncementsCount: stickyAnnouncements.length
    });
  } catch (error) {
    log('error', requestId, `Login route error: ${error.message}`);
    // Clean up service instance on failed login
    serviceManager.destroyService(req.sessionID);
    res.status(401).json({ error: error.message || 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Logout request', {
    user: req.session.user?.username,
    sessionId: req.sessionID?.substring(0, 8) + '...'
  });

  // Destroy the service instance for this session
  serviceManager.destroyService(req.sessionID);

  req.session.destroy((err) => {
    if (err) {
      log('error', requestId, `Logout failed: ${err.message}`);
      return res.status(500).json({ error: 'Logout failed' });
    }
    log('info', requestId, 'Logout successful', {
      activeServices: serviceManager.getActiveCount()
    });
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
  const requestId = generateRequestId();

  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const edunetaService = serviceManager.getServiceForSession(req.sessionID);

    if (req.session.edunetaCookies) {
      edunetaService.loadCookiesFromSession(req.session.edunetaCookies, requestId);
    }

    const isValid = await edunetaService.checkSession(requestId);

    if (!isValid) {
      serviceManager.destroyService(req.sessionID);
      req.session.destroy();
      return res.status(401).json({ error: 'Session expired' });
    }

    req.session.edunetaCookies = edunetaService.saveCookiesToSession();
    res.json({ success: true, message: 'Session valid' });
  } catch (error) {
    log('error', requestId, `Session refresh failed: ${error.message}`);
    serviceManager.destroyService(req.sessionID);
    req.session.destroy();
    res.status(401).json({ error: 'Session expired' });
  }
});

export default router;
