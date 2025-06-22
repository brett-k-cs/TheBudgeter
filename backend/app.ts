import express from 'express';
import cors from 'cors';

import { transactionsRouter } from './routes/transactions.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/transactions', transactionsRouter);

export default app;