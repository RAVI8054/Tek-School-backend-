import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import './config/firebase.js';

const PORT = process.env.PORT || 8000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
});
