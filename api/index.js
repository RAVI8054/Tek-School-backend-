import 'dotenv/config';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import '../src/config/firebase.js';

let isConnected = false;
let dbPromise = null;

// Vercel serverless function entrypoint
export default function handler(req, res) {
  // Handle preflight immediately without DB
  if (req.method === 'OPTIONS') {
    return app(req, res);
  }

  if (isConnected) {
    return app(req, res);
  }

  if (!dbPromise) {
    dbPromise = connectDB().then(() => {
      isConnected = true;
    });
  }

  dbPromise
    .then(() => {
      app(req, res);
    })
    .catch((err) => {
      console.error('Database connection failed:', err);
      res.status(500).json({ error: 'Database connection failed' });
    });
}
