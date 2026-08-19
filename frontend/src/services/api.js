const API_BASE = '/api';
import { getDailyCache, setDailyCache } from '../utils/cache';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE;
    this.requestLog = [];
    this.onAuthError = null;
  }

  setAuthErrorHandler(handler) {
    this.onAuthError = handler;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    const { headers, body, signal, ...rest } = options;

    const config = {
      ...rest,
      signal,
      body,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers
      },
      credentials: 'include'
    };

    try {
      const response = await fetch(url, config);
      const duration = Date.now() - startTime;
      const data = await response.json();

      this.requestLog.unshift({
        id: requestId,
        endpoint,
        method: options.method || 'GET',
        status: response.status,
        duration,
        timestamp: new Date().toISOString()
      });
      if (this.requestLog.length > 50) {
        this.requestLog.pop();
      }

      if (!response.ok) {
        if (response.status === 401 && this.onAuthError) {
          this.onAuthError();
        }
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.requestLog.unshift({
        id: requestId,
        endpoint,
        method: options.method || 'GET',
        status: 'error',
        duration,
        timestamp: new Date().toISOString(),
        error: error.message
      });
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  async login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async checkAuth() {
    return this.request('/auth/status');
  }

  async getStickyAnnouncements() {
    return this.request('/auth/sticky-announcements');
  }

  async getDashboard(useCache = true) {
    const cacheKey = 'dashboard_overview';
    if (useCache) {
      const cached = getDailyCache(cacheKey);
      if (cached) return cached;
    }
    const data = await this.request('/dashboard/overview');
    setDailyCache(cacheKey, data);
    return data;
  }

  async getTimetable() {
    return this.request('/timetable');
  }

  async postData(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getTodayTimetable(useCache = true) {
    const dateKey = new Date().toISOString().split('T')[0];
    const cacheKey = `timetable_today_${dateKey}`;
    if (useCache) {
      const cached = getDailyCache(cacheKey);
      if (cached) return cached;
    }
    const data = await this.request('/timetable/today');
    setDailyCache(cacheKey, data);
    return data;
  }

  async getWeeklyTimetable(date) {
    const params = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request(`/timetable/weekly${params}`);
  }

  async getNotifications(useCache = true) {
    const cacheKey = 'notifications_list';
    if (useCache) {
      const cached = getDailyCache(cacheKey);
      if (cached) return cached;
    }
    const data = await this.request('/notifications');
    setDailyCache(cacheKey, data);
    return data;
  }

  async getUnreadNotifications() {
    return this.request('/notifications/unread');
  }

  async getNotification(id, messageId = null) {
    const params = messageId ? `?idPP=${encodeURIComponent(messageId)}` : '';
    return this.request(`/notifications/${encodeURIComponent(id)}${params}`);
  }

  async markNotificationAsRead(id) {
    return this.request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
  }

  async getMessages(useCache = true) {
    const cacheKey = 'messages_inbox';
    if (useCache) {
      const cached = getDailyCache(cacheKey);
      if (cached) return cached;
    }
    const data = await this.request('/messages/inbox');
    setDailyCache(cacheKey, data);
    return data;
  }

  async markMessageAsRead(id) {
    return this.request(`/messages/${encodeURIComponent(id)}/read`, { method: 'POST' });
  }

  async getMessageThread(id) {
    return this.request(`/messages/thread/${encodeURIComponent(id)}`);
  }

  async getFiles(akc = null, options = {}) {
    const params = akc ? `?akc=${encodeURIComponent(akc)}` : '';
    return this.request(`/files${params}`, options);
  }

  async getFilesByHijer(idHijer, options = {}) {
    return this.request(`/files?idHijer=${encodeURIComponent(idHijer)}`, options);
  }

  async getFilesTree(options = {}) {
    return this.request('/files/tree', options);
  }

  async getRecentFiles() {
    return this.request('/files/recent');
  }

  async downloadFile(id) {
    const response = await fetch(`${this.baseUrl}/files/download/${encodeURIComponent(id)}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      if (response.status === 401 && this.onAuthError) {
        this.onAuthError();
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        throw new Error(data.error || 'Download failed');
      }
      throw new Error('Download failed');
    }
    const blob = await response.blob();
    const fileExtension = response.headers.get('x-file-extension') || '';
    return { blob, fileExtension };
  }

  async getExams() {
    return this.request('/exams');
  }

  async getGrades() {
    return this.request('/grades');
  }

  async getRegularity() {
    return this.request('/regularity');
  }

  async getPayments() {
    return this.request('/payments');
  }

  getRequestLog() {
    return this.requestLog;
  }

  clearRequestLog() {
    this.requestLog = [];
  }
}

export const api = new ApiService();
export default api;
