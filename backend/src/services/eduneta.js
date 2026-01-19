import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import crypto from 'crypto';

const EDUNETA_BASE_URL = process.env.EDUNETA_BASE_URL || 'https://eduneta.hr';
const EDUNETA_LOGIN_URL = `${EDUNETA_BASE_URL}/lib-student/Login.aspx`;

function generateRequestId() {
  return crypto.randomBytes(8).toString('hex');
}

function log(level, requestId, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    requestId,
    message,
    ...data
  };
  console.log(JSON.stringify(logEntry));
}

class EdunetaService {
  constructor() {
    this.cookies = {};
  }

  setCookies(cookies, requestId = 'init') {
    if (!cookies) return;
    if (typeof cookies === 'string') {
      const parts = cookies.split(';')[0].split('=');
      if (parts.length >= 2) {
        this.cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
      return;
    }
    if (Array.isArray(cookies)) {
      cookies.forEach(c => this.setCookies(c, requestId));
      return;
    }
    if (typeof cookies === 'object') {
      Object.entries(cookies).forEach(([key, value]) => {
        this.cookies[key] = value;
      });
      log('debug', requestId, 'Cookies set from object', { count: Object.keys(cookies).length });
    }
  }

  getCookieString() {
    return Object.entries(this.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }

  loadCookiesFromSession(sessionCookies, requestId = 'init') {
    if (!sessionCookies) return;
    const cookieCount = Object.keys(sessionCookies).length;
    if (cookieCount > 0) {
      this.setCookies(sessionCookies, requestId);
      log('debug', requestId, 'Loaded cookies from session', { count: cookieCount });
    }
  }

  saveCookiesToSession() {
    return { ...this.cookies };
  }

  parseCookies(setCookieHeaders, requestId = 'init') {
    if (!setCookieHeaders) return;
    const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    let cookieCount = 0;
    headers.forEach(header => {
      const parts = header.split(';')[0].split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        this.cookies[key] = value;
        cookieCount++;
      }
    });
    log('debug', requestId, 'Parsed cookies', { count: cookieCount });
  }

  decodeHtml(html, requestId = 'unknown') {
    if (!html) return '';
    const buffer = Buffer.from(html, 'binary');
    const decoded = iconv.decode(buffer, 'windows-1250');
    const hasCroatianChars = /[čćžšđČĆŽŠĐ]/.test(decoded);
    const sample = decoded.substring(0, 200).replace(/\s+/g, ' ').trim();
    log('debug', requestId, 'Decoded HTML', {
      originalLength: html.length,
      decodedLength: decoded.length,
      hasCroatianChars,
      sample
    });
    return decoded;
  }

  async request(method, url, data = null, followRedirects = true, requestId = null) {
    const rid = requestId || generateRequestId();
    const fullUrl = url.startsWith('http') ? url : `${EDUNETA_BASE_URL}${url}`;
    log('info', rid, `HTTP ${method} ${url}`, {
      hasData: !!data,
      followRedirects,
      fullUrl
    });

    const config = {
      method,
      url: fullUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': this.getCookieString(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': EDUNETA_BASE_URL + '/lib-student/'
      },
      maxRedirects: 0,
      validateStatus: () => true,
      responseType: 'arraybuffer'
    };

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    let response;
    try {
      response = await axios(config);
      log('debug', rid, `Response status: ${response.status}`, {
        contentLength: response.data?.length || 0,
        contentType: response.headers['content-type']
      });
    } catch (error) {
      log('error', rid, `Request failed: ${error.message}`, {
        code: error.code,
        url
      });
      throw error;
    }

    this.parseCookies(response.headers['set-cookie'], rid);

    if (followRedirects && (response.status === 302 || response.status === 301)) {
      let redirectCount = 0;
      while ((response.status === 302 || response.status === 301) && redirectCount < 10) {
        const location = response.headers.location;
        if (!location) break;
        
        log('debug', rid, `Following redirect ${redirectCount + 1}`, { location });
        
        const redirectUrl = location.startsWith('http') 
          ? location 
          : `${EDUNETA_BASE_URL}${location.startsWith('/') ? '' : '/lib-student/'}${location}`;
        
        try {
          response = await axios({
            method: 'GET',
            url: redirectUrl,
            headers: {
              'User-Agent': config.headers['User-Agent'],
              'Cookie': this.getCookieString(),
              'Accept': config.headers['Accept'],
              'Referer': config.url
            },
            maxRedirects: 0,
            validateStatus: () => true,
            responseType: 'arraybuffer'
          });
          
          this.parseCookies(response.headers['set-cookie'], rid);
          redirectCount++;
        } catch (error) {
          log('error', rid, `Redirect failed: ${error.message}`);
          break;
        }
      }
    }

    return response;
  }

  async getLoginPage(requestId = null) {
    const rid = requestId || generateRequestId();
    log('info', rid, 'Fetching login page');
    
    const response = await this.request('GET', EDUNETA_LOGIN_URL, null, true, rid);
    const html = this.decodeHtml(response.data, rid);
    const $ = cheerio.load(html);
    
    const viewState = $('input[name="__VIEWSTATE"]').val();
    const eventValidation = $('input[name="__EVENTVALIDATION"]').val();
    const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val();
    
    log('debug', rid, 'Login page parsed', {
      hasViewState: !!viewState,
      hasEventValidation: !!eventValidation,
      hasViewStateGenerator: !!viewStateGenerator
    });
    
    return { viewState, eventValidation, viewStateGenerator };
  }

  async login(username, password, requestId = null) {
    const rid = requestId || generateRequestId();
    log('info', rid, `Login attempt for user: ${username}`);
    
    try {
      this.cookies = {};
      
      const loginData = await this.getLoginPage(rid);

      const formData = new URLSearchParams();
      formData.append('__VIEWSTATE', loginData.viewState || '');
      formData.append('__VIEWSTATEGENERATOR', loginData.viewStateGenerator || '');
      formData.append('__EVENTVALIDATION', loginData.eventValidation || '');
      formData.append('login', username);
      formData.append('password', password);
      formData.append('butSubmit', 'Prijava');

      log('debug', rid, 'Submitting login form');

      const response = await this.request('POST', EDUNETA_LOGIN_URL, formData.toString(), true, rid);
      
      if (!this.cookies.studomatic) {
        log('error', rid, 'Login failed - no studomatic cookie');
        throw new Error('Neispravno korisničko ime ili lozinka');
      }

      const html = this.decodeHtml(response.data, rid);
      const $ = cheerio.load(html);
      const userName = $('#labKorisnik').text().trim();

      if (!userName) {
        log('error', rid, 'Login failed - no user name found');
        throw new Error('Prijava nije uspjela');
      }

      log('info', rid, `Login successful for: ${userName}`);

      return {
        success: true,
        message: 'Login successful',
        userName,
        cookies: Object.keys(this.cookies)
      };
    } catch (error) {
      log('error', rid, `Login error: ${error.message}`);
      throw error;
    }
  }

  async getPage(url, requestId = null) {
    const rid = requestId || generateRequestId();
    log('info', rid, `Fetching page: ${url}`);
    
    const fullUrl = url.startsWith('http') ? url : `${EDUNETA_BASE_URL}${url}`;
    const response = await this.request('GET', fullUrl, null, true, rid);
    
    if (response.status !== 200) {
      log('error', rid, `Failed to fetch ${url}: ${response.status}`);
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    
    const html = this.decodeHtml(response.data, rid);
    log('debug', rid, `Page fetched: ${url}`, {
      htmlLength: html.length,
      hasContent: html.length > 0
    });
    
    return html;
  }

  async postFormData(url, formData, requestId = null) {
    const rid = requestId || generateRequestId();
    log('info', rid, `Posting form to: ${url}`);
    
    const fullUrl = url.startsWith('http') ? url : `${EDUNETA_BASE_URL}${url}`;
    const response = await this.request('POST', fullUrl, formData, true, rid);
    
    if (response.status !== 200) {
      log('error', rid, `Failed to post ${url}: ${response.status}`);
      throw new Error(`Failed to post ${url}: ${response.status}`);
    }
    
    const html = this.decodeHtml(response.data, rid);
    log('debug', rid, `Form posted: ${url}`, { htmlLength: html.length });
    
    return html;
  }

  async getCookies(requestId = null) {
    return Object.entries(this.cookies).map(([key, value]) => ({ key, value }));
  }

  async checkSession(requestId = null) {
    const rid = requestId || generateRequestId();
    log('debug', rid, 'Checking session');
    
    try {
      if (!this.cookies.studomatic) {
        log('debug', rid, 'No studomatic cookie');
        return false;
      }
      const homeHtml = await this.getPage('/lib-student/Default.aspx', rid);
      const $ = cheerio.load(homeHtml);
      const userName = $('#labKorisnik').text().trim();
      const isValid = !!userName;
      log('debug', rid, `Session check: ${isValid ? 'valid' : 'invalid'}`);
      return isValid;
    } catch (error) {
      log('error', rid, `Session check failed: ${error.message}`);
      return false;
    }
  }
}

export default new EdunetaService();
export { generateRequestId, log };
