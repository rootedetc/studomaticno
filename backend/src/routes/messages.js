import express from 'express';
import * as cheerio from 'cheerio';
import { generateRequestId, log } from '../services/eduneta.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function parseMessages(html, requestId = 'unknown') {
  const rid = requestId || generateRequestId();
  log('info', rid, 'Parsing messages HTML');

  const $ = cheerio.load(html);
  const messages = [];

  const tableSelectors = [
    '#dgPoruke tr',
    'table[id="dgPoruke"] tr',
    '.dgPoruke tr'
  ];

  let messageCount = 0;
  let parsedCount = 0;

  for (const selector of tableSelectors) {
    const rows = $(selector);
    if (rows.length > 0) {
      log('debug', rid, `Found message table with selector: ${selector}`, { rowCount: rows.length });

      rows.not('.trHead, trHeadAlt, tr.head').each((index, row) => {
        messageCount++;
        const cols = $(row).find('td');

        if (cols.length < 6) {
          log('warn', rid, `Row ${index} has insufficient columns`, { count: cols.length });
          return;
        }

        const link = $(cols[6]).find('a').attr('href') || '';
        const linkMatch = link.match(/prikaziPoruku\((\d+),(\d+)\)/);

        const hasAttachment = $(cols[1]).find('img').length > 0 || $(cols[2]).find('img').length > 0;
        const hasReply = $(cols[8])?.find('a').attr('href') !== '';
        const isRead = $(cols[7])?.text().trim() !== '';

        const subject = $(cols[6]).text().trim();
        const sender = $(cols[4])?.text().trim() || '';
        const sentDate = $(cols[3])?.text().trim() || '';

        if (subject) {
          parsedCount++;
          const message = {
            id: linkMatch ? linkMatch[1] : null,
            messageId: linkMatch ? linkMatch[2] : null,
            sentDate,
            sender,
            recipient: $(cols[5])?.text().trim() || '',
            subject,
            readDate: $(cols[7])?.text().trim() || '',
            hasReply,
            hasAttachment,
            isRead
          };

          log('debug', rid, `Message parsed: ${message.id}`, {
            subject: message.subject.substring(0, 50),
            isRead: message.isRead,
            hasAttachment: message.hasAttachment
          });

          messages.push(message);
        }
      });
      break;
    }
  }

  log('info', rid, 'Messages parsing complete', {
    rowsFound: messageCount,
    messagesParsed: parsedCount,
    unreadCount: messages.filter(m => !m.isRead).length
  });

  return messages;
}

router.get('/inbox', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Fetching inbox');

  try {
    const html = await req.edunetaService.getPage('/lib-student/PorukePrimljene.aspx?idPV=1', requestId);
    const messages = parseMessages(html, requestId);

    const unreadCount = messages.filter(m => !m.isRead).length;

    log('info', requestId, 'Inbox fetched', {
      total: messages.length,
      unread: unreadCount
    });

    res.json({
      success: true,
      messages,
      unreadCount,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    log('error', requestId, `Inbox fetch error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

router.get('/unread', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Fetching unread messages');

  try {
    const html = await req.edunetaService.getPage('/lib-student/PorukePrimljene.aspx?idPV=1', requestId);
    const messages = parseMessages(html, requestId);
    const unread = messages.filter(m => !m.isRead);

    log('info', requestId, 'Unread messages fetched', { count: unread.length });

    res.json({
      success: true,
      messages: unread,
      count: unread.length
    });
  } catch (error) {
    log('error', requestId, `Unread fetch error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch unread messages' });
  }
});

router.get('/sent', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Fetching sent messages');

  try {
    const html = await req.edunetaService.getPage('/lib-student/PorukePoslane.aspx', requestId);
    const $ = cheerio.load(html);
    const messages = [];

    let sentCount = 0;
    $('#dgPoruke tr').not('.trHead, trHeadAlt').each((index, row) => {
      sentCount++;
      const cols = $(row).find('td');
      if (cols.length < 5) return;

      const message = {
        sentDate: $(cols[0]).text().trim(),
        recipient: $(cols[1]).text().trim(),
        subject: $(cols[2]).text().trim(),
        readDate: $(cols[3]).text().trim()
      };
      messages.push(message);
    });

    log('info', requestId, 'Sent messages fetched', { count: sentCount });

    res.json({
      success: true,
      messages,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    log('error', requestId, `Sent fetch error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch sent messages' });
  }
});

async function parseMessageDetail(edunetaService, id, messageId, requestId = null) {
  const rid = requestId || generateRequestId();
  log('info', rid, `Fetching message detail: id=${id}, messageId=${messageId}`);

  const html = await edunetaService.getPage(`/lib-student/PorukaPrikaz.aspx?idP=${id}&idPP=${messageId}`, rid);
  const $ = cheerio.load(html);

  log('debug', rid, 'Detail page loaded', { htmlLength: html.length });

  const subjectSelectors = [
    '#labTema', '#lblNaslov', '#labNaslov', '#lblSubject', '#ctl00_ContentPlaceHolder1_lblNaslov',
    '[id*="lblNaslov"]', '[id*="labNaslov"]', '[id*="Naslov"]',
    '.naslov', '.Naslov', 'span.naslov'
  ];
  const bodySelectors = [
    '#labTekstPoruke', '#lblSadrzaj', '#labSadrzaj', '#lblBody', '#lblSadržaj', '#ctl00_ContentPlaceHolder1_lblSadrzaj',
    '[id*="lblSadrzaj"]', '[id*="labSadrzaj"]', '[id*="Sadrzaj"]',
    '.sadrzaj', '.Sadrzaj', '.content', '.Content'
  ];
  const senderSelectors = [
    '#labPosiljatelj', '#lblPosiljatelj', '#labPosiljatelj', '#lblSender', '#ctl00_ContentPlaceHolder1_lblPosiljatelj',
    '[id*="lblPosiljatelj"]', '[id*="labPosiljatelj"]', '[id*="Posiljatelj"]',
    '.posiljatelj', '.Posiljatelj'
  ];
  const dateSelectors = [
    '#labVrijeme', '#lblDatum', '#labDatum', '#lblDate', '#ctl00_ContentPlaceHolder1_lblDatum',
    '[id*="lblDatum"]', '[id*="labDatum"]', '[id*="Datum"]',
    '.datum', '.Datum'
  ];
  const recipientSelectors = [
    '#lnkPrimatelj', '#lblPrimatelj', '#labPrimatelj', '#lblRecipient', '#ctl00_ContentPlaceHolder1_lblPrimatelj',
    '[id*="lblPrimatelj"]', '[id*="labPrimatelj"]', '[id*="Primatelj"]',
    '.primatelj', '.Primatelj'
  ];

  let subject = '';
  for (const sel of subjectSelectors) {
    const el = $(sel);
    if (el.length > 0) {
      subject = el.text().trim();
      if (subject) {
        log('debug', rid, `Subject found with selector: ${sel}`);
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
        log('debug', rid, `Body found with selector: ${sel}`);
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
        log('debug', rid, `Sender found with selector: ${sel}`);
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
        log('debug', rid, `Date found with selector: ${sel}`);
        break;
      }
    }
  }

  let recipient = '';
  for (const sel of recipientSelectors) {
    const el = $(sel);
    if (el.length > 0) {
      recipient = el.text().trim();
      if (recipient) {
        log('debug', rid, `Recipient found with selector: ${sel}`);
        break;
      }
    }
  }

  const attachmentSelectors = [
    '#dgPrilozi a', '#labPrilozi a', '[id*="Prilozi"] a', '.prilozi a',
    'table[id*="Prilozi"] a', 'a[id*="attachment"]', 'a[class*="attachment"]'
  ];
  const attachments = [];
  let attachmentCount = 0;

  log('debug', rid, 'Message detail parsed', {
    hasSubject: !!subject,
    hasBody: !!body,
    hasSender: !!sender,
    hasDate: !!date,
    attachmentCount
  });

  return {
    id,
    messageId,
    subject,
    body,
    sender,
    recipient,
    date,
    attachments,
    attachmentCount
  };
}

router.get('/thread/:id', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Fetching message thread', { id: req.params.id });

  try {
    const { id } = req.params;

    const inboxHtml = await req.edunetaService.getPage('/lib-student/PorukePrimljene.aspx?idPV=1', requestId);
    const messages = parseMessages(inboxHtml, requestId);

    log('debug', requestId, 'Parsed messages', { count: messages.length, firstFewIds: messages.slice(0, 3).map(m => m.id) });

    const message = messages.find(m => String(m.id) === String(id) || String(m.messageId) === String(id));
    if (!message) {
      log('warn', requestId, 'Message not found', { id, availableIds: messages.map(m => m.id).slice(0, 10) });
      return res.status(404).json({ error: 'Message not found in inbox' });
    }

    log('info', requestId, 'Message found', { id: message.id, messageId: message.messageId, subject: message.subject?.substring(0, 50) });

    const detail = await parseMessageDetail(req.edunetaService, message.id, message.messageId, requestId);

    log('info', requestId, 'Message thread fetched', {
      id,
      hasAttachments: detail.attachmentCount > 0,
      hasSubject: !!detail.subject,
      hasBody: !!detail.body
    });

    res.json({
      success: true,
      message: {
        ...message,
        ...detail
      }
    });
  } catch (error) {
    log('error', requestId, `Thread fetch error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch message thread' });
  }
});

router.post('/:id/read', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  const { id } = req.params;

  log('info', requestId, 'Marking message as read', { id });

  try {
    const inboxHtml = await req.edunetaService.getPage('/lib-student/PorukePrimljene.aspx?idPV=1', requestId);
    const messages = parseMessages(inboxHtml, requestId);

    const message = messages.find(m => String(m.id) === String(id) || String(m.messageId) === String(id));
    if (!message) {
      log('warn', requestId, 'Message not found for marking as read', { id });
      return res.status(404).json({ error: 'Message not found' });
    }

    log('info', requestId, 'Fetching message detail to mark as read', {
      id: message.id,
      messageId: message.messageId
    });

    await req.edunetaService.getPage(
      `/lib-student/PorukaPrikaz.aspx?idP=${message.id}&idPP=${message.messageId}`,
      requestId
    );

    log('info', requestId, 'Message marked as read successfully', { id });

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    log('error', requestId, `Failed to mark message as read: ${error.message}`);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

export default router;
