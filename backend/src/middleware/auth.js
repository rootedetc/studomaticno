import serviceManager from '../utils/service-manager.js';
import { generateRequestId, log } from '../services/eduneta.js';

/**
 * Authentication middleware - validates session and provides session-scoped service
 * 
 * This middleware:
 * 1. Checks if user is authenticated via session
 * 2. Gets or creates an EdunetaService instance for this session
 * 3. Loads cookies from session into the service
 * 4. Validates the Eduneta session is still active
 * 5. Attaches the service instance to req.edunetaService
 */
export const requireAuth = async (req, res, next) => {
  const requestId = generateRequestId();

  try {
    if (!req.session.user) {
      log('debug', requestId, 'Auth failed - no session user');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get session-scoped service instance
    const edunetaService = serviceManager.getServiceForSession(req.sessionID);

    // Load cookies from session into this service instance
    if (req.session.edunetaCookies) {
      edunetaService.loadCookiesFromSession(req.session.edunetaCookies, requestId);
    }

    // Validate the Eduneta session is still active
    const isValid = await edunetaService.checkSession(requestId);
    if (!isValid) {
      log('warn', requestId, 'Auth failed - Eduneta session expired', {
        user: req.session.user?.username
      });
      serviceManager.destroyService(req.sessionID);
      req.session.destroy();
      return res.status(401).json({ error: 'Session expired' });
    }

    // Save any updated cookies back to session
    req.session.edunetaCookies = edunetaService.saveCookiesToSession();

    // Attach service to request for use in route handlers
    req.edunetaService = edunetaService;

    next();
  } catch (error) {
    log('error', requestId, `Auth middleware error: ${error.message}`);
    serviceManager.destroyService(req.sessionID);
    req.session.destroy();
    return res.status(401).json({ error: error.message || 'Session expired' });
  }
};
