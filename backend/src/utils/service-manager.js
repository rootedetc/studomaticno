import { EdunetaService, generateRequestId, log } from '../services/eduneta.js';

/**
 * Service Manager - Manages per-session EdunetaService instances
 * 
 * This ensures each user session has its own isolated service instance
 * with its own cookie jar, preventing cross-contamination between users.
 */
class ServiceManager {
    constructor() {
        // Map of sessionId -> EdunetaService instance
        this.services = new Map();
    }

    /**
     * Get or create a service instance for a given session
     * @param {string} sessionId - The express session ID
     * @returns {EdunetaService} - The service instance for this session
     */
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

        return this.services.get(sessionId);
    }

    /**
     * Check if a session has an associated service instance
     * @param {string} sessionId - The express session ID
     * @returns {boolean}
     */
    hasService(sessionId) {
        return this.services.has(sessionId);
    }

    /**
     * Destroy the service instance for a session (on logout/expiry)
     * @param {string} sessionId - The express session ID
     */
    destroyService(sessionId) {
        if (this.services.has(sessionId)) {
            const requestId = generateRequestId();
            log('info', requestId, 'Destroying EdunetaService instance for session', {
                sessionId: sessionId.substring(0, 8) + '...'
            });
            this.services.delete(sessionId);
        }
    }

    /**
     * Get the count of active service instances (for debugging)
     * @returns {number}
     */
    getActiveCount() {
        return this.services.size;
    }

    /**
     * Clean up stale sessions (can be called periodically)
     * Note: This is a simple cleanup - in production, you'd want
     * to track last activity time for each session
     */
    cleanup() {
        const requestId = generateRequestId();
        const count = this.services.size;
        log('info', requestId, 'Service manager cleanup', { activeServices: count });
    }
}

// Single instance of the service manager
const serviceManager = new ServiceManager();

export default serviceManager;
export { serviceManager };
