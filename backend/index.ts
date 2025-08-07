import app from './app.js';

import dotenv from 'dotenv';
dotenv.config();

import { initializeDatabase } from './db.js';
import { initializePlaidClient } from "./plaid-manager.js";

const PORT = process.env.PORT || 3000;

initializeDatabase();
initializePlaidClient();


app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});