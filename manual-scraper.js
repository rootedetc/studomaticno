const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EDUNETA_BASE_URL = 'https://eduneta.hr';

const PAGES = [
  { name: 'dashboard', path: '/lib-student/Default.aspx', description: 'Dashboard' },
  { name: 'raspored', path: '/lib-student/Raspored.aspx', description: 'Raspored (Schedule)' },
  { name: 'ispiti', path: '/lib-student/Ispiti.aspx', description: 'Ispiti (Exams)' },
  { name: 'poruke-primljene', path: '/lib-student/PorukePrimljene.aspx?idPV=2', description: 'Obavijesti (Notifications)' },
  { name: 'poruke', path: '/lib-student/PorukePrimljene.aspx?idPV=1', description: 'Poruke (Messages)' },
  { name: 'dokumenti', path: '/lib-student/DocDownloadDesno.aspx?akc=10', description: 'Dokumenti (Documents)' },
  { name: 'indeks', path: '/lib-student/Indeks.aspx', description: 'Indeks (Grades)' },
  { name: 'prijavljeni-ispiti', path: '/lib-student/IzvPrijavljeniIspiti.aspx', description: 'Prijavljeni Ispiti' },
  { name: 'uplacene-rate', path: '/lib-student/IzvPlaceneRate.aspx', description: 'Rate (Payments)' },
  { name: 'redovitost', path: '/lib-student/IzvRedovitost.aspx', description: 'Redovitost (Attendance)' },
];

(async () => {
  console.log('=== EDUNETA MANUAL SCRAPER ===\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true
  });

  const page = await context.newPage();

  const captureDir = path.join(__dirname, 'backend', 'manual-scrape');
  if (!fs.existsSync(captureDir)) {
    fs.mkdirSync(captureDir, { recursive: true });
  }

  console.log('Available pages to scrape:');
  PAGES.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name.padEnd(20)} - ${p.description}`);
  });
  console.log(`  0. Custom URL (enter full path)`);
  console.log(`  q. Quit\n`);

  const savePage = async (pageName) => {
    const timestamp = Date.now();
    const filename = `${pageName}-${timestamp}.html`;
    const filepath = path.join(captureDir, filename);

    const html = await page.content();
    const url = page.url();

    fs.writeFileSync(filepath, html);

    console.log(`  💾 Saved: ${filename}`);
    console.log(`  📄 Size: ${(html.length / 1024).toFixed(1)} KB`);
    console.log(`  🔗 URL: ${url}\n`);

    return { filename, url, timestamp };
  };

  const scrapeCurrentPage = async () => {
    const url = page.url();
    let pageName = 'unknown';

    for (const p of PAGES) {
      if (url.includes(p.path)) {
        pageName = p.name;
        break;
      }
    }

    if (pageName === 'unknown') {
      const pathMatch = url.match(/eduneta\.hr(\/lib-student\/[^?]+)/);
      pageName = pathMatch ? pathMatch[1].replace(/[^a-z0-9]/gi, '-') : 'custom';
    }

    return await savePage(pageName);
  };

  const navigateToPage = async (pageInfo) => {
    const url = pageInfo.path.startsWith('http')
      ? pageInfo.path
      : `${EDUNETA_BASE_URL}${pageInfo.path}`;

    console.log(`  Navigating to ${pageInfo.name}...`);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    return await scrapeCurrentPage();
  };

  console.log('Navigating to Eduneta login...');
  await page.goto(`${EDUNETA_BASE_URL}/lib-student/Login.aspx`);
  await page.waitForLoadState('domcontentloaded');

  console.log('🟢 Ready! Login to Eduneta manually.');
  console.log('After login, use commands below:\n');

  process.stdin.setRawMode(true);
  process.stdin.resume();

  process.stdin.on('data', async (key) => {
    const char = key.toString();

    if (char === 'q' || char === '\u0003') {
      console.log('\n👋 Closing browser...');
      await browser.close();
      process.exit(0);
    }

    if (char === '\n' || char === '\r') {
      try {
        await scrapeCurrentPage();
      } catch (e) {
        console.log(`❌ Error: ${e.message}`);
      }
    }

    if (char >= '1' && char <= '9') {
      const index = parseInt(char) - 1;
      if (index < PAGES.length) {
        try {
          await navigateToPage(PAGES[index]);
        } catch (e) {
          console.log(`❌ Error: ${e.message}`);
        }
      }
    }

    if (char === '0') {
      console.log('Enter custom path (e.g., /lib-student/SomePage.aspx): ');
    }
  });

  console.log('Commands:');
  console.log('  ENTER   - Scrape current page');
  console.log('  1-9    - Navigate to predefined page and scrape');
  console.log('  0      - Enter custom URL');
  console.log('  q      - Quit\n');
})();
