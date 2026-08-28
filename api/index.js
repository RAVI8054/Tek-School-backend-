import 'dotenv/config';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import '../src/config/firebase.js';

// Vercel serverless function entrypoint
export default async function handler(req, res) {
  if (req.method !== 'OPTIONS') {
    // Ensure database is connected before handling the request
    await connectDB();
  }

  // Let Express handle the request and wrap it in a promise
  // so Vercel doesn't resolve the async function before the response is sent.
  return new Promise((resolve, reject) => {
    res.on('finish', resolve);
    res.on('error', reject);
    app(req, res);
  });
}
