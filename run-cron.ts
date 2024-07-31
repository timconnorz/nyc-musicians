import https from 'https';
import http from 'http';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// In production, environment variables are typically set directly in the environment
// rather than loaded from a .env file
const envPath =
  process.env.NODE_ENV === 'production'
    ? undefined
    : resolve(__dirname, '.env.local');

if (envPath) {
  console.log('Loading .env file from:', envPath);
  dotenv.config({ path: envPath });
} else {
  console.log('Running in production mode, using environment variables');
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
if (!baseUrl) {
  console.error('Error: NEXT_PUBLIC_APP_URL is not defined in the environment');
  process.exit(1);
}

const url = new URL(`${baseUrl}/api/cron/newsletter`);

const cronKey = process.env.CRON_KEY;
if (!cronKey) {
  console.error('Error: CRON_KEY is not defined in the environment');
  process.exit(1);
}

url.searchParams.append('CRON_KEY', cronKey);

// Use http for localhost, https for other URLs
const protocol = url.hostname === 'localhost' ? http : https;

protocol
  .get(url.toString(), res => {
    let data = '';
    res.on('data', chunk => (data += chunk));
    res.on('end', () => {
      try {
        console.log(JSON.parse(data));
      } catch (error) {
        console.error('Error parsing response:', data);
      }
    });
  })
  .on('error', err => console.error('Error:', err.message));
