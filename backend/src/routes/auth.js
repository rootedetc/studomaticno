import express from 'express';
import edunetaService from '../services/eduneta.js';
import { singleUserLock } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', singleUserLock, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
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

    res.json({
      success: true,
      message: 'Login successful',
      user: { username, name: result.userName }
    });
  } catch (error) {
    console.error('Login route error:', error);
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
