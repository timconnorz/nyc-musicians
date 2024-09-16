import https from 'https';
import http from 'http';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { NextResponse } from 'next/server';

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
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('Error loading .env file:', result.error.message);
    process.exit(1);
  } else {
    console.log('.env file loaded successfully');
  }
} else {
  console.log('Running in production mode, using environment variables');
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
if (!baseUrl) {
  console.error('Error: NEXT_PUBLIC_APP_URL is not defined in the environment');
  process.exit(1);
}
console.log('Base URL:', baseUrl);

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
  .request(
    url.toString(),
    { method: 'POST', headers: { Authorization: `Bearer ${cronKey}` } },
    res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          console.log(JSON.parse(data));
        } catch (error) {
          console.error('Error parsing response:', data);
        }
      });
    }
  )
  .on('error', err => console.error('Error during request:', err))
  .end();
