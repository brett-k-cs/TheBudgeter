import { Request, Response, Router } from 'express';

import { Transaction } from '../models/transaction.js';

const router = Router();

router.get('/', async (req, res) => {
  console.log('Fetching transactions for user:', req.user!.id);
  
  const transactions = await Transaction.findAll({
    order: [['date', 'DESC']],
    attributes: ['id', 'type', 'amount', 'category', 'description', 'date', 'createdAt', 'updatedAt'],
    where: { 
      userId: req.user!.id,
    },
  });

  res.json({ success: true, data: transactions });
});

interface TransactionRequestBody {
  type: 'withdrawal' | 'deposit';
  amount: number;
  description: string;
  category: string;
  date: string; // ISO date string
}

router.post('/', async (req: Request<{}, {}, TransactionRequestBody>, res: Response) => {
  const { type, amount, description, category, date } = req.body;
  if (!type || !amount || !description || !category || !date) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const userId = req.user!.id;

  // further validation e.g. typeof checks
  if (typeof type !== 'string' || typeof description !== 'string' || typeof amount !== 'number' || typeof category !== 'string') {
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

router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const transactionId = parseInt(req.params.id, 10);
  if (isNaN(transactionId)) {
    res.status(400).json({ error: 'Invalid transaction ID' });
    return;
  }
  try {
    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    // Check if the transaction belongs to the user
    if (transaction.userId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await transaction.destroy();
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete transactions in bulk
router.delete('/', async (req: Request<{}, {}, { ids: number[] }>, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'Invalid IDs format' });
    return;
  }

  try {
    // Find all transactions that match the IDs and belong to the user
    const transactions = await Transaction.findAll({
      where: {
        id: ids,
        userId: req.user!.id,
      },
      limit: 1, // Limit to 1 to check if any exist
    });

    if (transactions.length === 0) {
      res.status(404).json({ error: 'No transactions found for the provided IDs' });
      return;
    }

    // Delete all found transactions
    await Transaction.destroy({
      where: {
        id: ids,
        userId: req.user!.id,
      },
    });

    res.json({ message: 'Transactions deleted successfully' });
  } catch (error) {
    console.error('Error deleting transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/import', async (req: Request<{}, {}, { data: TransactionRequestBody[] }>, res: Response) => {
  const { data } = req.body;
  if (!Array.isArray(data) || data.length === 0) {
    res.status(400).json({ error: 'Invalid data format' });
    return;
  }

  try {
    const transactions = await Transaction.bulkCreate(data.map(item => ({
      userId: req.user!.id,
      type: item.type,
      amount: item.amount,
      category: item.category,
      description: item.description,
      date: new Date(item.date), // Convert ISO string to Date object
    })));

    res.status(201).json({ message: "Success!", data: transactions });
  } catch (error) {
    console.error('Error importing transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const transactionsRouter = router;