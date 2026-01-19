import fs from 'fs';
import edunetaService from './src/services/eduneta.js';

const USERNAME = 'makojic';
const PASSWORD = 'Sifra123!';

async function scrape() {
  try {
    console.log('Logging in...');
    await edunetaService.login(USERNAME, PASSWORD);
    console.log('Logged in!');

    const examWeeks = ['2025-12-15', '2026-01-06', '2026-01-13', '2026-02-02'];

    for (const date of examWeeks) {
      console.log(`\nFetching: ${date}`);
      const html = await edunetaService.getPage(`/lib-student/raspored.aspx?date=${date}`);
      const filename = `eduneta-scrape/raspored-exams-${date}.html`;
      fs.writeFileSync(filename, html);
      console.log(`Saved: ${filename} (${html.length} bytes)`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

scrape();
