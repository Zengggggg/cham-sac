/**
 * Anh em Twobars: Giang Dam, Louis, Antonie was here
 * All our efforts are for a brighter future, where we can freely eat bread and drink bubble tea without worrying about someone stealing it.
 * Updated by Louis on 2026-06-16
 */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import connectDB from './config/mongodb.js';
import { getAuthEnvironment, getEmailEnvironment } from './config/environment.js';
import { API_PREFIX } from './config/api.js';
import swaggerSpec from './config/swagger.js';
import router from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware.js';

const app = express();
app.disable('x-powered-by');

const PORT = process.env.PORT || 8080;

// CORS configuration - QUAN TRỌNG!
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(morgan('dev'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Chạm Sắc Việt API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true
  }
}));

app.use(API_PREFIX, router);
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    getAuthEnvironment();
    getEmailEnvironment();
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Unable to start server: ${error.message}`);
    process.exitCode = 1;
  }
};

startServer();
