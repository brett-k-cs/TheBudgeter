import { Request, Response, Router } from 'express';

import { Transaction } from '../models/transaction.js';

const router = Router();

router.get('/monthlyIncome', async (req, res) => {
  res.json(await Transaction.findAll({
    order: [['date', 'DESC']],
    attributes: ['amount', 'date'],
    where: { 
      userId: req?.user?.id || 1,
    },
  }));
});

export const summariesRouter = router;