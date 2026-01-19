import axios from 'axios';
import * as tough from 'tough-cookie';
import * as cheerio from 'cheerio';

const EDUNETA_BASE_URL = 'https://eduneta.hr';
const EDUNETA_LOGIN_URL = `${EDUNETA_BASE_URL}/lib-student/Login.aspx`;

async function testLogin() {
  const jar = new tough.CookieJar();
  const client = axios.create({
    baseURL: EDUNETA_BASE_URL,
    withCredentials: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    },
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400
  });

  client.interceptors.request.use((config) => {
    return new Promise((resolve) => {
      jar.getCookies(EDUNETA_BASE_URL, (err, cookies) => {
        if (err) {
          console.error('Cookie retrieval error:', err);
          return resolve(config);
        }
        const cookieString = cookies.map(c => `${c.key}=${c.value}`).join('; ');
        config.headers['Cookie'] = cookieString;
        resolve(config);
      });
    });
  });

  client.interceptors.response.use(
    (response) => {
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        cookies.forEach((cookie) => {
          try {
            const c = tough.Cookie.parse(cookie);
            jar.setCookie(c, EDUNETA_BASE_URL, () => {});
          } catch (e) {
            console.error('Failed to parse cookie:', e.message);
          }
        });
      }
      return response;
    },
    async (error) => {
      if (error.response?.status === 302) {
        const cookies = error.response.headers['set-cookie'];
        if (cookies) {
          cookies.forEach((cookie) => {
            try {
              const c = tough.Cookie.parse(cookie);
              jar.setCookie(c, EDUNETA_BASE_URL, () => {});
            } catch (e) {
              console.error('Failed to parse cookie:', e.message);
            }
          });
        }
      }
      throw error;
    }
  );

  try {
    console.log('Getting login page...');
    const loginPage = await client.get(EDUNETA_LOGIN_URL);
    const $ = cheerio.load(loginPage.data);
    
    const viewState = $('input[name="__VIEWSTATE"]').val();
    const eventValidation = $('input[name="__EVENTVALIDATION"]').val();
    const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val();
    
    console.log('Form values found:', {
      viewState: viewState ? 'yes' : 'no',
      eventValidation: eventValidation ? 'yes' : 'no',
      viewStateGenerator: viewStateGenerator ? 'yes' : 'no'
    });

    const formData = new URLSearchParams();
    formData.append('__VIEWSTATE', viewState || '');
    formData.append('__VIEWSTATEGENERATOR', viewStateGenerator || '');
    formData.append('__EVENTVALIDATION', eventValidation || '');
    formData.append('login', 'wronguser');
    formData.append('password', 'wrongpass');
    formData.append('butSubmit', 'Prijava');

    console.log('Testing wrong credentials...');
    const response = await client.post('/lib-student/Login.aspx', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': EDUNETA_LOGIN_URL,
        'Origin': EDUNETA_BASE_URL
      },
      maxRedirects: 5
    });

    console.log('Response status:', response.status);
    console.log('Response URL:', response.request?.path);
    console.log('Response headers:', Object.keys(response.headers));
    
    const $response = cheerio.load(response.data);
    const valCustom = $response('#valCustom');
    console.log('valCustom after failed login:');
    console.log('  text:', valCustom.text());
    console.log('  style:', valCustom.attr('style'));
    console.log('  visibility:', valCustom.css('visibility'));
    
    const hasUser = $response('#labKorisnik').length > 0;
    console.log('Has user info:', hasUser);
    
    if (hasUser) {
      console.log('User:', $response('#labKorisnik').text());
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response URL:', error.response.request?.path);
    }
  }
}

testLogin();