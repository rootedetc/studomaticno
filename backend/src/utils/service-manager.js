import { EdunetaService, generateRequestId, log } from '../services/eduneta.js';

const STALE_AFTER_MS = 25 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Manages per-session EdunetaService instances so cookie jars stay isolated.
 */
class ServiceManager {
  constructor() {
    this.services = new Map();
    this.lastUsed = new Map();
    this.cleanupTimer = setInterval(() => this.cleanupStale(), CLEANUP_INTERVAL_MS);
    if (typeof this.cleanupTimer.unref === 'function') {
      this.cleanupTimer.unref();
    }
  }

  getServiceForSession(sessionId) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    if (!this.services.has(sessionId)) {
      const requestId = generateRequestId();
      log('info', requestId, 'Creating new EdunetaService instance for session', {
        sessionId: sessionId.substring(0, 8) + '...'
      });
      this.services.set(sessionId, new EdunetaService());
    }

    this.lastUsed.set(sessionId, Date.now());
    return this.services.get(sessionId);
  }

  hasService(sessionId) {
    return this.services.has(sessionId);
  }

  rekeyService(oldSessionId, newSessionId) {
    if (!oldSessionId || !newSessionId || oldSessionId === newSessionId) return;
    if (this.services.has(oldSessionId)) {
      this.services.set(newSessionId, this.services.get(oldSessionId));
      this.services.delete(oldSessionId);
    }
    if (this.lastUsed.has(oldSessionId)) {
      this.lastUsed.set(newSessionId, this.lastUsed.get(oldSessionId));
      this.lastUsed.delete(oldSessionId);
    }
  }

  destroyService(sessionId) {
    if (this.services.has(sessionId)) {
      const requestId = generateRequestId();
      log('info', requestId, 'Destroying EdunetaService instance for session', {
        sessionId: sessionId.substring(0, 8) + '...'
      });
      this.services.delete(sessionId);
      this.lastUsed.delete(sessionId);
    }
  }

  getActiveCount() {
    return this.services.size;
  }

  cleanupStale() {
    const now = Date.now();
    for (const [sessionId, usedAt] of this.lastUsed) {
      if (now - usedAt > STALE_AFTER_MS) {
        this.destroyService(sessionId);
      }
    }
  }
}

const serviceManager = new ServiceManager();

export default serviceManager;
export { serviceManager };
