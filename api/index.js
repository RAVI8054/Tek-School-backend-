import 'dotenv/config';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import '../src/config/firebase.js';

// Connect to the database
await connectDB().catch(console.error);

export default app;
