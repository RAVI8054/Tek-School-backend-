import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { globalErrorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/AppError.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    let clientUrls = process.env.CLIENT_URL;
    if (!clientUrls) {
      if (process.env.NODE_ENV === 'production') {
        // Fail loudly in production to prevent insecure CORS defaults
        throw new Error(
          'CRITICAL: CLIENT_URL environment variable is missing in production!'
        );
      }
      clientUrls = 'http://localhost:5173';
    }

    const allowedOrigins = clientUrls.split(',').map(
      (url) => url.trim().replace(/\/$/, '') // Remove any trailing slash
    );

    // Remove trailing slash from incoming origin just in case
    const incomingOrigin = origin.replace(/\/$/, '');

    if (allowedOrigins.includes(incomingOrigin)) {
      return callback(null, true);
    }

    // Instead of throwing an error which causes a 500 status, just return false
    // This allows the browser to handle the CORS failure cleanly
    return callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Handle browser preflight requests before route matching or DB work.
app.options('/{*path}', cors(corsOptions));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Mount Centralized Router
app.use('/api/v1', routes);

app.get('/', (_req, res) => {
  res
    .status(200)
    .json({ status: 'success', message: 'Welcome to Tek School Backend API' });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.all('/{*path}', (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found on this server.`, 404));
});

app.use(globalErrorHandler);

export default app;
