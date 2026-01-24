import crypto from 'crypto';
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
import serviceManager from './utils/service-manager.js';
import { generateRequestId, log } from './services/eduneta.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Auto-generate session secret if not provided (persists for app lifetime)
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) {
  console.log('Warning: SESSION_SECRET not set, using auto-generated secret. Sessions will be invalidated on server restart.');
}

// CORS: Use FRONTEND_URL if set, otherwise allow same-origin requests (for DO App Platform where frontend/backend share domain)
const corsOrigin = process.env.FRONTEND_URL || true;

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
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
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

app.listen(PORT, () => {
  console.log(`studomaticno backend running on http://localhost:${PORT}`);
});
