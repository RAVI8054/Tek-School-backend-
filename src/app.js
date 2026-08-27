import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { globalErrorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/AppError.js';

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Mount Centralized Router
app.use('/api/v1', routes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.all('/{*path}', (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found on this server.`, 404));
});

app.use(globalErrorHandler);

export default app;
