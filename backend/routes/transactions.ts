import { Request, Response, Router } from 'express';

import { Transaction } from '../models/transaction.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json(await Transaction.findAll({
    order: [['date', 'DESC']],
    attributes: ['id', 'type', 'amount', 'category', 'description', 'date', 'createdAt', 'updatedAt'],
    where: { 
      userId: req.query.userId ? parseInt(req.query.userId as string, 10) : 1,
    },
  }));
});

interface TransactionRequestBody {
  userId: number;
  type: 'withdrawal' | 'deposit';
  amount: number;
  description: string;
  category: string;
  date: string; // ISO date string
}

router.post('/', async (req: Request<{}, {}, TransactionRequestBody>, res: Response) => {
  const { userId, type, amount, description, category, date } = req.body;
  if (!userId || !type || !amount || !description || !category || !date) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // further validation e.g. typeof checks
  if (typeof userId !== 'number' || typeof type !== 'string' || typeof description !== 'string' || typeof amount !== 'number' || typeof category !== 'string') {
    res.status(400).json({ error: 'Invalid data types' });
    return;
  }

  if (type !== 'withdrawal' && type !== 'deposit') {
    res.status(400).json({ error: 'Invalid transaction type' });
    return;
  }

  if (amount <= 0) {
    res.status(400).json({ error: 'Amount must be greater than zero' });
    return;
  }

  try {
    // Create the transaction
    const transaction = await Transaction.create({
      userId,
      type,
      amount,
      category,
      description,
      date: new Date(date), // Convert ISO string to Date object
    });
    res.status(201).json({ message: "Success!", data: transaction });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

export const transactionsRouter = router;