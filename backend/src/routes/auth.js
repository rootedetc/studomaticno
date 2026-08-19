import express from 'express';
import serviceManager from '../utils/service-manager.js';
import { generateRequestId, log } from '../services/eduneta.js';

const router = express.Router();

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const loginAttempts = new Map();

function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function isLoginRateLimited(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) return false;
  if (now - entry.start > LOGIN_WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  return entry.count >= LOGIN_MAX_ATTEMPTS;
}

function recordLoginAttempt(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.start > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { start: now, count: 1 });
    return;
  }
  entry.count += 1;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts) {
    if (now - entry.start > LOGIN_WINDOW_MS) {
      loginAttempts.delete(ip);
    }
  }
}, LOGIN_WINDOW_MS).unref?.();

function isExpectedLoginError(message) {
  return /korisničko|lozinka|Prijava nije uspjela/i.test(message || '');
}

router.post('/login', async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Login request received');

  const ip = getClientIp(req);
  if (isLoginRateLimited(ip)) {
    log('warn', requestId, 'Login rate limited');
    return res.status(429).json({ error: 'Previše pokušaja prijave. Pokušajte kasnije.' });
  }

  try {
    const { username, password } = req.body;

    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
      log('warn', requestId, 'Login failed - missing credentials');
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (username.length > 100 || password.length > 200) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    recordLoginAttempt(ip);

    const oldSessionId = req.sessionID;
    const edunetaService = serviceManager.getServiceForSession(oldSessionId);

    const result = await edunetaService.login(username.trim(), password, requestId);

    let stickyAnnouncements = [];
    try {
      stickyAnnouncements = await edunetaService.processStickyAnnouncements(async (announcement) => {
        log('info', requestId, 'Sticky announcement processed', {
          id: announcement.id,
          title: announcement.title?.substring(0, 50)
        });
      }, requestId);
    } catch (stickyError) {
      log('warn', requestId, `Sticky announcements failed after login: ${stickyError.message}`);
    }

    const edunetaCookies = edunetaService.saveCookiesToSession();

    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) return reject(err);
        serviceManager.rekeyService(oldSessionId, req.sessionID);
        req.session.user = {
          username: username.trim(),
          userName: result.userName,
          loginTime: new Date().toISOString()
        };
        req.session.edunetaCookies = edunetaCookies;
        req.session.stickyAnnouncements = stickyAnnouncements;
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
        resolve();
      });
    });

    log('info', requestId, 'Login complete', {
      stickyCount: stickyAnnouncements.length,
      activeServices: serviceManager.getActiveCount()
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: { username: username.trim(), name: result.userName },
      stickyAnnouncementsCount: stickyAnnouncements.length
    });
  } catch (error) {
    log('error', requestId, `Login route error: ${error.message}`);
    serviceManager.destroyService(req.sessionID);
    const message = isExpectedLoginError(error.message) ? error.message : 'Prijava nije uspjela';
    res.status(401).json({ error: message });
  }
});

router.post('/logout', (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Logout request', {
    sessionId: req.sessionID?.substring(0, 8) + '...'
  });

  serviceManager.destroyService(req.sessionID);

  req.session.destroy((err) => {
    if (err) {
      log('error', requestId, `Logout failed: ${err.message}`);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('studomaticno.sid', { path: '/' });
    res.clearCookie('connect.sid', { path: '/' });
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

    const isValid = await edunetaService.checkSession(requestId, { force: true });

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
