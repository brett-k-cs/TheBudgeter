import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";

import { authenticateTokenMiddelware } from "./middleware/authMiddleware.js";

import { authRouter } from "./routes/auth.js";
import { summariesRouter } from "./routes/summaries.js";
import { transactionsRouter } from "./routes/transactions.js";
import { budgetsRouter } from "./routes/budgets.js";
import { accountsRouter } from "./routes/accounts.js";

const app = express();

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/dashboard", authenticateTokenMiddelware, summariesRouter);
app.use("/api/transactions", authenticateTokenMiddelware, transactionsRouter);
app.use("/api/budgets", authenticateTokenMiddelware, budgetsRouter);
app.use("/api/accounts", authenticateTokenMiddelware, accountsRouter);

export default app;
