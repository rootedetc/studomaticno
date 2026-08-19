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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET is required when NODE_ENV=production');
  process.exit(1);
}

app.set('trust proxy', 1);
app.disable('x-powered-by');

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-constant-key';
if (!process.env.SESSION_SECRET) {
  console.log('Warning: SESSION_SECRET not set, using fixed dev secret. Do not use in production!');
}

const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = frontendUrl
  ? [frontendUrl]
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
});

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use(session({
  name: 'studomaticno.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: isProduction && frontendUrl ? 'none' : 'lax'
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

if (!isProduction) {
  app.get('/api/debug/page', async (req, res) => {
    const requestId = generateRequestId();
    log('info', requestId, 'Debug page fetch');

    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL parameter required' });
      }

      if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated - login first to use debug routes' });
      }

      if (/^https?:\/\//i.test(url) || url.includes('..') || url.includes('\\')) {
        return res.status(400).json({ error: 'Only relative Eduneta paths are allowed' });
      }

      const edunetaService = serviceManager.getServiceForSession(req.sessionID);
      if (req.session.edunetaCookies) {
        edunetaService.loadCookiesFromSession(req.session.edunetaCookies, requestId);
      }

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
      res.status(500).json({ error: 'Debug page fetch failed' });
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
      res.status(500).json({ error: 'Encoding test failed' });
    }
  });
}

const setNoCacheHeaders = (res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
};

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

app.get('*', (req, res) => {
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
