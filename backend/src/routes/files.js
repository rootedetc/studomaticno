import express from 'express';
import * as cheerio from 'cheerio';
import json5 from 'json5';
import edunetaService, { generateRequestId, log } from '../services/eduneta.js';
import { requireAuth } from '../middleware/auth.js';
import iconv from 'iconv-lite';

const router = express.Router();

const EDUNETA_BASE_URL = process.env.EDUNETA_BASE_URL || 'https://eduneta.hr';

function buildTree(nodes) {
  const nodeMap = {};
  const roots = [];
  
  nodes.forEach(node => {
    nodeMap[node.id] = { ...node, children: [] };
  });
  
  nodes.forEach(node => {
    const treeNode = nodeMap[node.id];
    if (node.parentId && nodeMap[node.parentId]) {
      nodeMap[node.parentId].children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  });
  
  return roots;
}

function parseFiles(html, requestId = 'unknown') {
  const rid = requestId || generateRequestId();
  log('info', rid, 'Parsing files HTML');
  
  const $ = cheerio.load(html);
  const files = [];

  const folderMatch = html.match(/DocDownloadDesno\.aspx\?idHijer=(\d+)/);
  const folderId = folderMatch ? folderMatch[1] : null;

  log('debug', rid, 'Folder ID extracted', { folderId });

  const tableSelectors = [
    'table[id="dg"] tr',
    'table.dg tr',
    '#dg tr'
  ];

  let rowCount = 0;
  let parsedCount = 0;

  for (const selector of tableSelectors) {
    const rows = $(selector);
    if (rows.length > 0) {
      log('debug', rid, `Found files table with selector: ${selector}`, { rowCount: rows.length });
      
      rows.not('.trHead, trHeadAlt, tr.head, tr.trHead, tr.trHeadAlt').each((index, row) => {
        rowCount++;
        const cols = $(row).find('td');
        
        if (cols.length < 4) {
          return;
        }

        const link = $(cols[1]).find('a').attr('href') || '';
        const linkMatch = link.match(/getFile\.aspx\?id=(\d+)/);
        const icon = $(cols[0]).find('img').attr('src') || '';

        let type = 'unknown';
        const iconLower = icon.toLowerCase();
        if (iconLower.includes('doc')) type = 'doc';
        else if (iconLower.includes('pdf')) type = 'pdf';
        else if (iconLower.includes('xls')) type = 'xls';
        else if (iconLower.includes('ppt')) type = 'ppt';
        else if (iconLower.includes('zip')) type = 'zip';
        else if (iconLower.includes('img') || iconLower.includes('image')) type = 'image';

        const name = $(cols[1]).text().trim();
        if (!name) return;

        parsedCount++;
        const file = {
          id: linkMatch ? linkMatch[1] : null,
          type,
          name,
          size: $(cols[2])?.text().trim() || '',
          description: $(cols[3])?.text().trim() || '',
          uploadedBy: $(cols[4])?.text().trim() || '',
          date: $(cols[5])?.text().trim() || '',
          downloadUrl: link || null
        };

        log('debug', rid, `File parsed: ${file.id}`, {
          name: file.name.substring(0, 30),
          type: file.type,
          hasDownloadUrl: !!file.downloadUrl
        });

        files.push(file);
      });
      break;
    }
  }

  const noFilesMsg = $('#labPoruka').text().trim();
  if (noFilesMsg && (noFilesMsg.toLowerCase().includes('nema dokumenata') || noFilesMsg.toLowerCase().includes('nema datoteka'))) {
    log('info', rid, 'No files message found', { message: noFilesMsg });
    return { folderId, files: [], message: noFilesMsg };
  }

  log('info', rid, 'Files parsing complete', {
    folderId,
    rowsFound: rowCount,
    filesParsed: parsedCount
  });

  return { folderId, files };
}

router.get('/', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Fetching files', { akc: req.query.akc, idHijer: req.query.idHijer });

  try {
    const { akc, idHijer } = req.query;
    let url;

    if (idHijer) {
      url = `/lib-student/DocDownloadDesno.aspx?idHijer=${idHijer}`;
    } else {
      url = akc ? `/lib-student/DocDownloadDesno.aspx?akc=${akc}` : '/lib-student/DocDownloadDesno.aspx?akc=10';
    }

    log('debug', requestId, 'Fetching files URL', { url });

    const html = await edunetaService.getPage(url, requestId);

    if (html.includes('frameset') || html.includes('FRAME')) {
      log('warn', requestId, 'Received frameset instead of content, trying alternate URL');
      if (idHijer) {
        const altUrl = `/lib-student/DocDownloadDesno.aspx?idHijer=${idHijer}`;
        const altHtml = await edunetaService.getPage(altUrl, requestId);
        if (!altHtml.includes('frameset')) {
          log('info', requestId, 'Got content from alternate URL');
        }
      } else {
        const altUrl = `/lib-student/DocDownloadDesno.aspx?akc=${akc || 10}`;
        const altAltUrl = '/lib-student/DocDownloadDesno.aspx';
        const altHtml = await edunetaService.getPage(altUrl, requestId);
        if (altHtml.includes('frameset')) {
          const altAltHtml = await edunetaService.getPage(altAltUrl, requestId);
          if (!altAltHtml.includes('frameset')) {
            log('info', requestId, 'Got content from base URL');
          }
        }
      }
    }

    const result = parseFiles(html, requestId);

    if (result.files.length === 0 && result.folderId) {
      log('info', requestId, 'No files found in current folder', { folderId: result.folderId });
    }

    log('info', requestId, 'Files fetched', {
      folderId: result.folderId,
      count: result.files.length,
      message: result.message
    });

    res.json({
      success: true,
      folderId: result.folderId || idHijer,
      idHijer: idHijer ? parseInt(idHijer) : null,
      files: result.files,
      totalCount: result.files.length,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    log('error', requestId, `Files fetch error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

router.get('/tree', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Fetching documents tree START');

  try {
    log('debug', requestId, 'About to fetch DocDownloadTree.aspx');
    let html = await edunetaService.getPage('/lib-student/DocDownloadTree.aspx?akc=10', requestId);

    log('debug', requestId, 'Tree HTML received', { length: html.length, startsWith: html.substring(0, 100) });

    if (html.includes('frameset') || html.includes('FRAME')) {
      log('warn', requestId, 'Received frameset for tree, trying DocDownloadFS.aspx');
      const fsHtml = await edunetaService.getPage('/lib-student/DocDownloadFS.aspx?akc=10', requestId);
      if (fsHtml.includes('DocDownloadTree.aspx')) {
        log('info', requestId, 'Extracting tree URL from frameset');
        const treeMatch = fsHtml.match(/src=["']DocDownloadTree\.aspx[^"']*["']/i);
        if (treeMatch) {
          const treeUrl = treeMatch[0].match(/src=["']([^"']+)["']/i);
          if (treeUrl && treeUrl[1]) {
            html = await edunetaService.getPage(treeUrl[1], requestId);
            log('info', requestId, 'Fetched tree from extracted URL');
          }
        }
      }
    }

    if (html.includes('frameset') || html.includes('FRAME')) {
      log('warn', requestId, 'Still got frameset, trying DocDownloadDesno.aspx as fallback');
      const desnoHtml = await edunetaService.getPage('/lib-student/DocDownloadDesno.aspx?akc=10', requestId);
      if (desnoHtml.includes('tvClientData')) {
        html = desnoHtml;
      }
    }

    log('debug', requestId, 'Final HTML for parsing', { length: html.length, sample: html.substring(0, 500) });

    let tvData = [];

    const patterns = [
      /window\["tvClientData"\]\s*=\s*(\[.+?\]);/s,
      /window\['tvClientData'\]\s*=\s*(\[.+?\]);/s,
      /tvClientData\s*=\s*(\[.+?\]);/s,
      /var\s+tvClientData\s*=\s*(\[.+?\]);/s
    ];

    log('debug', requestId, 'Looking for tvClientData patterns');
    let matchedPattern = null;
    let matchFound = null;
    for (const pattern of patterns) {
      const match = html.match(pattern);
      log('debug', requestId, 'Trying pattern', { pattern: pattern.toString().substring(0, 30), found: !!match });
      if (match) {
        matchFound = match;
        matchedPattern = pattern.toString().substring(0, 50);
        try {
          let jsonStr = match[1].trim();
          log('debug', requestId, 'Matched content preview', { preview: jsonStr.substring(0, 100) });
          if (!jsonStr.startsWith('[')) {
            jsonStr = '[' + jsonStr;
          }
          if (!jsonStr.endsWith(']')) {
            jsonStr = jsonStr + ']';
          }
          tvData = json5.parse(jsonStr);
          log('debug', requestId, 'Found tvClientData with json5', { pattern: matchedPattern, count: tvData.length });
          break;
        } catch (e) {
          log('warn', requestId, 'Failed to parse tvClientData JSON5', { error: e.message, snippet: match[1].substring(0, 200) });
          try {
            let jsonStr = match[1].replace(/'/g, '"').trim();
            if (!jsonStr.startsWith('[')) {
              jsonStr = '[' + jsonStr;
            }
            if (!jsonStr.endsWith(']')) {
              jsonStr = jsonStr + ']';
            }
            tvData = JSON.parse(jsonStr);
            log('debug', requestId, 'Found tvClientData with replaced quotes', { count: tvData.length });
            break;
          } catch (e2) {
            log('warn', requestId, 'Failed to parse tvClientData with replaced quotes', { error: e2.message });
          }
        }
      }
    }

    log('info', requestId, 'Parsing complete', { tvDataCount: tvData.length, matchedPattern });

    if (tvData.length === 0) {
      log('error', requestId, 'Could not find tvClientData in tree page', { 
        htmlLength: html.length,
        hasFrameset: html.includes('frameset'),
        hasTvClientData: html.includes('tvClientData'),
        htmlPreview: html.substring(0, 3000)
      });
      return res.status(500).json({ 
        error: 'Failed to parse tree data - no tvClientData found in page',
        debug: {
          htmlLength: html.length,
          hasFrameset: html.includes('frameset'),
          hasTvClientData: html.includes('tvClientData'),
          preview: html.substring(0, 1000).replace(/\s+/g, ' ').trim()
        }
      });
    }

    log('debug', requestId, 'Parsed tree data', { count: tvData.length });

    const nodes = tvData.map((item) => {
      const hierarchyId = item[0];
      const name = item[1];
      const value = item[2];
      
      const parts = hierarchyId.split('_');
      parts.pop();
      const parentId = parts.length > 1 ? parts.join('_') : null;
      
      return {
        id: hierarchyId,
        hierarchyId: parseInt(value),
        parentId: parentId,
        name: name
      };
    });

    const tree = buildTree(nodes);

    log('info', requestId, 'Tree fetched', {
      totalNodes: tvData.length,
      rootFolders: tree.length
    });

    res.json({
      success: true,
      tree,
      nodeCount: tvData.length,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    log('error', requestId, `Tree fetch error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch documents tree' });
  }
});

router.get('/download/:id', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Downloading file', { id: req.params.id });
  
  try {
    const { id } = req.params;
    
    log('debug', requestId, 'Starting file download request', { id });
    
    const response = await edunetaService.request('GET', `/lib-student/getFile.aspx?id=${id}`, null, true, requestId);
    
    log('debug', requestId, 'Download response received', {
      status: response.status,
      contentType: response.headers['content-type'],
      contentLength: response.data?.length
    });

    if (response.status !== 200 || !response.data || response.data.length === 0) {
      log('error', requestId, 'Invalid download response', {
        status: response.status,
        contentLength: response.data?.length
      });
      return res.status(500).json({ error: 'Failed to download file' });
    }

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
    let filename = `file-${id}`;
    if (contentDisposition) {
      const rfc5987Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (rfc5987Match) {
        filename = decodeURIComponent(rfc5987Match[1]);
      } else {
        const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
          try {
            const buffer = Buffer.from(filename, 'binary');
            const utf8 = iconv.decode(buffer, 'windows-1250');
            if (utf8 && utf8 !== filename) {
              filename = utf8;
            }
          } catch (e) {
          }
        }
      }
    }

    const dataStr = response.data.toString('utf-8');
    const isHtml = contentType.includes('text/html') || dataStr.trim().startsWith('<!DOCTYPE') || dataStr.trim().startsWith('<html');
    if (isHtml) {
      log('warn', requestId, 'Received HTML instead of file', {
        contentType,
        preview: dataStr.substring(0, 500).replace(/\s+/g, ' ')
      });
      if (dataStr.toLowerCase().includes('login') || dataStr.includes('prijava')) {
        log('error', requestId, 'Session expired, received login page');
        return res.status(401).json({ error: 'Session expired, please login again' });
      }
      return res.status(500).json({ error: 'Server returned HTML instead of file. Session may have expired.' });
    }

    log('debug', requestId, 'File download prepared', {
      filename,
      contentType,
      size: response.data.length
    });

    const fileData = Buffer.isBuffer(response.data) ? response.data : Buffer.from(response.data);
    res.setHeader('Content-Type', contentType);
    
    const hasNonAscii = /[^\x00-\x7F]/.test(filename);
    let disposition;
    if (hasNonAscii) {
      disposition = `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`;
    } else {
      disposition = `attachment; filename="${filename}"`;
    }
    res.setHeader('Content-Disposition', disposition);
    res.setHeader('Content-Length', fileData.length);
    res.send(fileData);
  } catch (error) {
    log('error', requestId, `File download error: ${error.message}`, {
      stack: error.stack,
      name: error.name,
      response: error.response ? {
        status: error.response.status,
        headers: error.response.headers
      } : null
    });
    res.status(500).json({ error: 'Failed to download file' });
  }
});

router.get('/recent', requireAuth, async (req, res) => {
  const requestId = generateRequestId();
  log('info', requestId, 'Fetching recent files');
  
  try {
    const html = await edunetaService.getPage('/lib-student/DocDownloadDesno.aspx?akc=10', requestId);
    const result = parseFiles(html, requestId);
    const recent = result.files.slice(0, 10);

    log('info', requestId, 'Recent files fetched', { count: recent.length });

    res.json({
      success: true,
      files: recent,
      count: recent.length
    });
  } catch (error) {
    log('error', requestId, `Recent files fetch error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch recent files' });
  }
});

export default router;
