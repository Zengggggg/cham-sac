/**
 * Anh em Twobars: Giang Dam, Louis, Antonie was here
 * All our efforts are for a brighter future, where we can freely eat bread and drink bubble tea without worrying about someone stealing it.
 * Updated by Louis on 2026-06-16
 */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { connect } from 'mongoose';
import morgan from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';

import connectDB from './config/mongodb.js';
import router from './routes/index.js';

import passport from 'passport';

const app = express();

const PORT = process.env.PORT || 8080;

// CORS configuration - QUAN TRỌNG!
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(morgan('dev'));

connectDB();

app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/herdays-api', router);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});