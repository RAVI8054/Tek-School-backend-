import 'dotenv/config';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import '../src/config/firebase.js';

// Vercel serverless function entrypoint
export default async function handler(req, res) {
  // Ensure database is connected before handling the request
  await connectDB();

  // Let Express handle the request
  return app(req, res);
}
