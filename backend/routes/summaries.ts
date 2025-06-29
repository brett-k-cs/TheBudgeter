import { Request, Response, Router } from 'express';

import { Op } from 'sequelize';

import { Transaction } from '../models/transaction.js';

const router = Router();

router.get('/monthlyReport', async (req, res) => {
  const now = new Date();
  const monthsToSubtract = 8;
  const startYear = now.getFullYear() - (now.getMonth() < monthsToSubtract ? 1 : 0);
  const startMonthIndex = ((now.getMonth() - monthsToSubtract) % 12 + 12) % 12;
  const startMonth = new Date(startYear, startMonthIndex, 1);
  const startDateNumber = startMonth.getTime();

  const data = await Transaction.findAll({
    order: [['date', 'ASC']],
    attributes: ['amount', 'date', 'type'],
    where: { 
      userId: req.user!.id,
      // type: 'deposit',
      date: {
        [Op.gte]: startDateNumber
      },
    },
  });

  const months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

  const monthlyIncome = data.filter(a => a.type == 'deposit').reduce((acc: Record<string, number>, transaction) => {
    const month = months[new Date(transaction.date).getMonth()]; // for jan-dec
    if (!acc[month])
      acc[month] = 0;
    
    acc[month] += parseFloat(transaction.amount.toString());
    return acc;
  }, {});

  const incomeLabels = Object.keys(monthlyIncome);
  const incomeValues = Object.values(monthlyIncome);

  const monthlySpending = data.filter(a => a.type == 'withdrawal').reduce((acc: Record<string, number>, transaction) => {
    const month = months[new Date(transaction.date).getMonth()]; // for jan-dec
    if (!acc[month])
      acc[month] = 0;
    
    acc[month] += parseFloat(transaction.amount.toString());
    return acc;
  }, {});
  const spendingLabels = Object.keys(monthlySpending);
  const spendingValues = Object.values(monthlySpending);

  res.json({ success: true, income: { labels: incomeLabels, data: incomeValues }, spending: { labels: spendingLabels, data: spendingValues } });
});

router.get('/spendingByCategory', async (req, res) => {
  const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const data = await Transaction.findAll({
    attributes: ['amount', 'date', 'category'],
    where: { 
      userId: req.user!.id,
      type: 'withdrawal',
      date: {
        [Op.gte]: startDate.getTime(),
      },
    },
  });

  const categories = data.reduce((acc: Record<string, number>, transaction) => {
    const category = transaction.category || 'Other';
    acc[category] = (acc[category] || 0) + parseFloat(transaction.amount.toString());
    return acc;
  }, {});

  const labels = Object.keys(categories);
  const values = Object.values(categories);

  res.json({ success: true, data: { labels, values } });
});

export const summariesRouter = router;