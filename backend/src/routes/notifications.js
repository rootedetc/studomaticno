import express from 'express';
import * as cheerio from 'cheerio';
import edunetaService, { generateRequestId, log } from '../services/eduneta.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function parseNotifications(html, requestId = 'unknown') {
  const rid = requestId || generateRequestId();
  log('info', rid, 'Parsing notifications HTML');
  
  const $ = cheerio.load(html);
  const notifications = [];

  const tableSelectors = [
    '#dgPoruke tr',
    'table[id="dgPoruke"] tr',
    '.dgPoruke tr'
  ];

  let rowCount = 0;
  let parsedCount = 0;

  for (const selector of tableSelectors) {
    const rows = $(selector);
    if (rows.length > 0) {
      log('debug', rid, `Found notifications table with selector: ${selector}`, { rowCount: rows.length });
      
      rows.not('.trHead, trHeadAlt, tr.head').each((index, row) => {
        rowCount++;
        const cols = $(row).find('td');
        
        if (cols.length < 7) {
          log('warn', rid, `Row ${index} has insufficient columns`, { count: cols.length });
          return;
        }

        const link = $(cols[6]).find('a').attr('href') || '';
        const linkMatch = link.match(/prikaziPoruku\((\d+),(\d+)\)/);

        const title = $(cols[6]).text().trim();
        const date = $(cols[3]).text().trim();
        const sender = $(cols[4]).text().trim();
        const readDate = $(cols[7])?.text().trim() || '';
        const isRead = readDate !== '';

        if (title) {
          parsedCount++;
          const notification = {
            id: linkMatch ? linkMatch[1] : String(index),
            messageId: linkMatch ? linkMatch[2] : null,
            title,
            date,
            author: sender,
            isRead,
            isNew: !isRead,
            link
          };
          
          log('debug', rid, `Notification parsed: ${notification.id}`, {
            title: notification.title.substring(0, 50),
            isNew: notification.isNew
          });
          
          notifications.push(notification);
        }
      });
      break;
    }
  }

  log('info', rid, 'Notifications parsing complete', {
    rowsFound: rowCount,
    notificationsParsed: parsedCount,
    unreadCount: notifications.filter(n => n.isNew).length
  });

  return notifications;
}

router.get('/', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Fetching notifications');
  
  try {
    const html = await edunetaService.getPage('/lib-student/PorukePrimljene.aspx?idPV=2', requestId);
    const notifications = parseNotifications(html, requestId);

    const unreadCount = notifications.filter(n => n.isNew).length;

    log('info', requestId, 'Notifications fetched', {
      total: notifications.length,
      unread: unreadCount
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    log('error', requestId, `Notifications fetch error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/unread', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Fetching unread notifications');
  
  try {
    const html = await edunetaService.getPage('/lib-student/PorukePrimljene.aspx?idPV=2', requestId);
    const notifications = parseNotifications(html, requestId);
    const unread = notifications.filter(n => n.isNew);

    log('info', requestId, 'Unread notifications fetched', { count: unread.length });

    res.json({
      success: true,
      notifications: unread,
      count: unread.length
    });
  } catch (error) {
    log('error', requestId, `Unread notifications fetch error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch unread notifications' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  const { id } = req.params;
  const { idPP } = req.query;

  log('info', requestId, 'Fetching notification detail', { id, idPP });

  try {
    const url = idPP
      ? `/lib-student/PorukaPrikaz.aspx?idP=${id}&idPP=${idPP}`
      : `/lib-student/PorukaPrikaz.aspx?idP=${id}`;
    const html = await edunetaService.getPage(url, requestId);
    const $ = cheerio.load(html);

    log('debug', requestId, 'Detail page loaded', { htmlLength: html.length, url });

    const subjectSelectors = [
      '#labTema', '#lblNaslov', '#labNaslov', '#ctl00_ContentPlaceHolder1_lblNaslov',
      '[id*="lblNaslov"]', '[id*="labNaslov"]', '[id*="Naslov"]',
      '.naslov', '.Naslov', 'span.naslov'
    ];
    const bodySelectors = [
      '#labTekstPoruke', '#lblSadrzaj', '#labSadrzaj', '#lblSadržaj', '#ctl00_ContentPlaceHolder1_lblSadrzaj',
      '[id*="lblSadrzaj"]', '[id*="labSadrzaj"]', '[id*="Sadrzaj"]',
      '.sadrzaj', '.Sadrzaj', '.content', '.Content'
    ];
    const senderSelectors = [
      '#labPosiljatelj', '#lblPosiljatelj', '#labPosiljatelj', '#ctl00_ContentPlaceHolder1_lblPosiljatelj',
      '[id*="lblPosiljatelj"]', '[id*="labPosiljatelj"]', '[id*="Posiljatelj"]',
      '.posiljatelj', '.Posiljatelj'
    ];
    const dateSelectors = [
      '#labVrijeme', '#lblDatum', '#labDatum', '#ctl00_ContentPlaceHolder1_lblDatum',
      '[id*="lblDatum"]', '[id*="labDatum"]', '[id*="Datum"]',
      '.datum', '.Datum'
    ];

    let subject = '';
    for (const sel of subjectSelectors) {
      const el = $(sel);
      if (el.length > 0) {
        subject = el.text().trim();
        if (subject) {
          log('debug', requestId, `Subject found: ${sel}`);
          break;
        }
      }
    }

    let body = '';
    for (const sel of bodySelectors) {
      const el = $(sel);
      if (el.length > 0) {
        body = el.html() || '';
        if (body) {
          log('debug', requestId, `Body found: ${sel}`);
          break;
        }
      }
    }

    if (body) {
      body = body
        .replace(/<o:p[^>]*>.*?<\/o:p>/gi, '')
        .replace(/<font[^>]*>/gi, '')
        .replace(/<\/font>/gi, '')
        .replace(/<span[^>]*>/gi, '')
        .replace(/<\/span>/gi, '')
        .replace(/<p[^>]*class="MsoNormal"[^>]*>/gi, '<p>')
        .replace(/<p class="MsoNormal"[^>]*>/gi, '<p>')
        .replace(/<div>\s*<br>\s*<\/div>/gi, '{{EMPTY_LINE}}')
        .replace(/<div><br><\/div>/gi, '{{EMPTY_LINE}}');

      const parseDivs = (html) => {
        const result = [];
        let remaining = html;
        const divOpen = '<div>';
        const divClose = '</div>';
        
        while (remaining.length > 0) {
          const openIndex = remaining.indexOf(divOpen);
          const closeIndex = remaining.indexOf(divClose);
          
          if (openIndex === -1 && closeIndex === -1) {
            result.push(remaining);
            break;
          }
          
          if (closeIndex !== -1 && (openIndex === -1 || closeIndex < openIndex)) {
            result.push(remaining.substring(0, closeIndex));
            remaining = remaining.substring(closeIndex + divClose.length);
            continue;
          }
          
          if (openIndex !== -1 && (closeIndex === -1 || openIndex < closeIndex)) {
            if (openIndex > 0) {
              result.push(remaining.substring(0, openIndex));
            }
            remaining = remaining.substring(openIndex + divOpen.length);
            
            let depth = 1;
            let searchFrom = 0;
            let found = false;
            
            while (searchFrom < remaining.length && depth > 0) {
              const nextOpen = remaining.indexOf(divOpen, searchFrom);
              const nextClose = remaining.indexOf(divClose, searchFrom);
              
              if (nextClose === -1) break;
              
              if (nextOpen !== -1 && nextOpen < nextClose) {
                result.push(remaining.substring(0, nextOpen));
                depth++;
                remaining = remaining.substring(nextOpen + divOpen.length);
                searchFrom = 0;
              } else {
                if (depth === 1) {
                  const content = remaining.substring(0, nextClose);
                  const trimmed = content.trim();
                  if (trimmed === '{{EMPTY_LINE}}' || !trimmed) {
                    result.push('<br>');
                  } else {
                    result.push(trimmed + '<br>');
                  }
                  remaining = remaining.substring(nextClose + divClose.length);
                  found = true;
                  break;
                } else {
                  result.push(remaining.substring(0, nextClose + divClose.length));
                  remaining = remaining.substring(nextClose + divClose.length);
                  depth--;
                  searchFrom = 0;
                }
              }
            }
            
            if (!found) break;
          }
        }
        
        return result.join('');
      };
      
      body = parseDivs(body)
        .replace(/<span>(.*?)<\/span>/gi, '$1')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\{\{EMPTY_LINE\}\}/gi, '<br>')
        .replace(/(<br>\s*){3,}/gi, '<br><br>')
        .replace(/^(<br>\s*)+/gi, '')
        .replace(/(<br>\s*)+$/gi, '')
        .trim();
    }

    let sender = '';
    for (const sel of senderSelectors) {
      const el = $(sel);
      if (el.length > 0) {
        sender = el.text().trim();
        if (sender) {
          log('debug', requestId, `Sender found: ${sel}`);
          break;
        }
      }
    }

    let date = '';
    for (const sel of dateSelectors) {
      const el = $(sel);
      if (el.length > 0) {
        date = el.text().trim();
        if (date) {
          log('debug', requestId, `Date found: ${sel}`);
          break;
        }
      }
    }

    log('debug', requestId, 'Notification detail parsed', {
      hasSubject: !!subject,
      hasBody: !!body,
      hasSender: !!sender,
      hasDate: !!date
    });

    res.json({
      success: true,
      notification: {
        id,
        title: subject,
        content: body,
        author: sender,
        date,
        isNew: false
      }
    });
  } catch (error) {
    log('error', requestId, `Notification detail fetch error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch notification details' });
  }
});

export default router;
