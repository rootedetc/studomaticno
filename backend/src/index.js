import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import authRoutes from './routes/auth.js';
import timetableRoutes from './routes/timetable.js';
import notificationsRoutes from './routes/notifications.js';
import messagesRoutes from './routes/messages.js';
import filesRoutes from './routes/files.js';
import dashboardRoutes from './routes/dashboard.js';
import examsRoutes from './routes/exams.js';
import gradesRoutes from './routes/grades.js';
import regularityRoutes from './routes/regularity.js';
import paymentsRoutes from './routes/payments.js';
import calendarRoutes from './routes/calendar.js';
import serviceManager from './utils/service-manager.js';
import { generateRequestId, log } from './services/eduneta.js';

dotenv.config();

// ES Module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Trust first proxy (required for secure cookies behind reverse proxy like DigitalOcean App Platform)
// Trust proxy for secure cookies behind reverse proxy
app.set('trust proxy', 1);

// Use fixed secret for development stability if env var not set
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-constant-key';
if (!process.env.SESSION_SECRET) {
  console.log('Warning: SESSION_SECRET not set, using fixed dev secret. Do not use in production!');
}

// CORS: Use FRONTEND_URL if set, otherwise explicitly allow local dev frontend
// Must specify exact origin when using credentials (cannot use wildcard)
const corsOrigin = process.env.FRONTEND_URL || ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    // FORCE SECURE FALSE for local development to ensure cookies are set over HTTP
    secure: false, 
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    // FORCE LAX for local development to ensure cookies are sent
    sameSite: 'lax'
  }
}));


app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/regularity', regularityRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/calendar', calendarRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/debug/page', async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Debug page fetch', { url: req.query.url });

  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated - login first to use debug routes' });
    }

    const edunetaService = serviceManager.getServiceForSession(req.sessionID);
    if (req.session.edunetaCookies) {
      edunetaService.loadCookiesFromSession(req.session.edunetaCookies, requestId);
    }

    const fullUrl = url.startsWith('http') ? url : `https://eduneta.hr${url}`;
    const html = await edunetaService.getPage(url, requestId);

    const $ = cheerio.load(html);
    const viewState = $('input[name="__VIEWSTATE"]').val();
    const eventValidation = $('input[name="__EVENTVALIDATION"]').val();
    const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val();

    const previewLength = 15000;
    const hasCroatian = /[čćžšđČĆŽŠĐ]/.test(html);

    res.json({
      success: true,
      debug: {
        url,
        htmlLength: html.length,
        hasCroatianChars: hasCroatian,
        sampleHtml: html.substring(0, previewLength),
        viewStateLength: viewState?.length || 0,
        hasEventValidation: !!eventValidation,
        extractedFields: {
          viewState: viewState ? viewState.substring(0, 100) + '...' : null,
          eventValidation: eventValidation ? eventValidation.substring(0, 100) + '...' : null,
          viewStateGenerator
        },
        availableForms: $('form').map((i, f) => ({
          id: $(f).attr('id'),
          action: $(f).attr('action'),
          method: $(f).attr('method')
        })).get(),
        tablesFound: $('table').map((i, t) => ({
          id: $(t).attr('id'),
          class: $(t).attr('class'),
          rows: $(t).find('tr').length
        })).get(),
        labelsFound: $('span[id^="lbl"], label[id^="lbl"], div[id^="lbl"]').map((i, el) => ({
          id: $(el).attr('id'),
          text: $(el).text().substring(0, 100)
        })).get(),
        isLoginPage: html.includes('Prijava') && html.includes('login')
      },
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    log('error', requestId, `Debug page error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/debug/test-encoding', async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Encoding test');

  try {
    const testPhrases = ['čćžšđ', 'ČĆŽŠĐ', 'Školski raspored', 'Poruke', 'Obavijesti'];

    const results = testPhrases.map(phrase => ({
      original: phrase,
      encoded: Buffer.from(phrase).toString('binary'),
      decoded: (() => {
        const buf = Buffer.from(Buffer.from(phrase).toString('binary'), 'binary');
        return iconv.decode(buf, 'windows-1250');
      })()
    }));

    res.json({
      success: true,
      encodingTest: {
        source: 'windows-1250',
        target: 'utf-8',
        results,
        allMatch: results.every(r => r.original === r.decoded)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const setNoCacheHeaders = (res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
};

// Serve static frontend files in production
// The frontend build output is at ../frontend/dist relative to backend root
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath, {
  setHeaders: (res, filePath) => {
    if (
      filePath.endsWith('index.html') ||
      filePath.endsWith('sw.js') ||
      filePath.endsWith('manifest.webmanifest')
    ) {
      setNoCacheHeaders(res);
    }
  }
}));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api')) {
    setNoCacheHeaders(res);
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

app.listen(PORT, () => {
  console.log(`studomaticno backend running on http://localhost:${PORT}`);
});
