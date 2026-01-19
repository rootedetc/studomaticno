import { chromium } from 'playwright';

async function testFullFlow() {
  console.log('Starting browser...');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/605.1.15'
  });

  const page = await context.newPage();

  // Capture console messages
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
  });

  page.on('request', (request) => {
    if (request.url().includes('/api/')) {
      console.log(`[API REQUEST] ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', (response) => {
    if (response.url().includes('/api/')) {
      console.log(`[API RESPONSE] ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('\n=== Opening Frontend ===');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('Page title:', await page.title());

    // Wait for login form
    await page.waitForSelector('input[type="text"], input[name="username"]', { timeout: 5000 });
    console.log('Login form found!');

    // Fill in credentials (dummy)
    console.log('\nFilling in credentials...');
    await page.fill('input[type="text"], input[name="username"]', 'testuser@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'testpassword');

    // Click login
    console.log('Clicking login button...');
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(3000);

    console.log('\nAfter login attempt:');
    console.log('- Current URL:', page.url());

    // Check for error message
    const errorEl = await page.$('.bg-red-50, .text-red-700, [class*="error"]');
    if (errorEl) {
      const errorText = await errorEl.textContent();
      console.log('- Error message:', errorText?.substring(0, 200));
    }

  } catch (error) {
    console.error('Error during test:', error.message);
  }

  console.log('\nTest complete. Browser will stay open for inspection.');
}

testFullFlow();
