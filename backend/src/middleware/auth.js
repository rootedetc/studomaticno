import edunetaService from '../services/eduneta.js';

export const requireAuth = async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.edunetaCookies) {
      edunetaService.loadCookiesFromSession(req.session.edunetaCookies);
    }

    const isValid = await edunetaService.checkSession();
    if (!isValid) {
      req.session.destroy();
      return res.status(401).json({ error: 'Session expired' });
    }

    req.session.edunetaCookies = edunetaService.saveCookiesToSession();

    next();
  } catch (error) {
    req.session.destroy();
    return res.status(401).json({ error: error.message || 'Session expired' });
  }
};

export const singleUserLock = (req, res, next) => {
  if (process.env.ENFORCE_SINGLE_USER === 'true' && req.session.user) {
    const sessionUser = req.session.user.username;
    const requestUser = req.body?.username || req.query?.username;

    if (requestUser && requestUser !== sessionUser) {
      return res.status(403).json({
        error: 'Single user mode active',
        message: `Currently logged in as ${sessionUser}`
      });
    }
  }
  next();
};
