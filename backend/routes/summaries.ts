import { Request, Response, Router } from 'express';

import { Op } from 'sequelize';

import { Transaction } from '../models/transaction.js';
import { PlaidItem } from '../models/plaidItem.js';
import { Account } from '../models/account.js';
import { Asset } from '../models/asset.js';

import { plaidClient } from '../plaid-manager.js';
import { getBalances } from './plaid.js';

const router = Router();

router.get('/monthlyReport', async (req, res) => {
  const now = new Date();
  const monthsToSubtract = 8;
  const startYear = now.getFullYear() - (now.getMonth() < monthsToSubtract ? 1 : 0);
  const startMonthIndex = ((now.getMonth() - monthsToSubtract) % 12 + 12) % 12;
  const startMonth = new Date(startYear, startMonthIndex, 1, 0, 0, 0, 0); // Set to the first day of the month at midnight
  const startDateNumber = startMonth.getTime();

  const data = await Transaction.findAll({
    order: [['date', 'ASC']],
    attributes: ['amount', 'date', 'type', 'category'],
    where: { 
      userId: req.user!.id,
      // type: 'deposit',
      date: {
        [Op.gte]: startDateNumber
      },
    },
  });

  const months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

  const monthlyIncome = data.filter(a => a.category == "income").reduce((acc: Record<string, number>, transaction) => {
    const month = months[new Date(transaction.date).getMonth()]; // for jan-dec
    if (!acc[month])
      acc[month] = 0;
    
    acc[month] += parseFloat(transaction.amount.toString()) * (transaction.type == 'withdrawal' ? -1 : 1);
    return acc;
  }, {});

  const incomeLabels = Object.keys(monthlyIncome);
  const incomeValues = Object.values(monthlyIncome);

  const monthlySpending = data.filter(a => a.type == 'withdrawal' && a.category != "income").reduce((acc: Record<string, number>, transaction) => {
    const month = months[new Date(transaction.date).getMonth()]; // for jan-dec
    if (!acc[month])
      acc[month] = 0;
    
    acc[month] += parseFloat(transaction.amount.toString()) * (transaction.type == 'withdrawal' ? 1 : -1);
    return acc;
  }, {});
  const spendingLabels = Object.keys(monthlySpending);
  const spendingValues = Object.values(monthlySpending);

  res.json({ success: true, income: { labels: incomeLabels, data: incomeValues }, spending: { labels: spendingLabels, data: spendingValues } });
});

router.get('/spendingByCategory', async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Default to current month if no dates provided
  const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = endDate ? new Date(endDate as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

  const data = await Transaction.findAll({
    attributes: ['amount', 'date', 'category'],
    where: { 
      userId: req.user!.id,
      type: 'withdrawal',
      date: {
        [Op.gte]: start.getTime(),
        [Op.lte]: end.getTime(),
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

// New endpoint for category drill-down
router.get('/categoryTransactions', async (req, res) => {
  const { category, startDate, endDate } = req.query;
  
  if (!category) {
    res.status(400).json({ error: 'Category is required' });
    return;
  }

  // Default to current month if no dates provided
  const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = endDate ? new Date(endDate as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

  const transactions = await Transaction.findAll({
    order: [['date', 'DESC']],
    attributes: ['id', 'amount', 'description', 'date'],
    where: { 
      userId: req.user!.id,
      type: 'withdrawal',
      category: category as string,
      date: {
        [Op.gte]: start.getTime(),
        [Op.lte]: end.getTime(),
      },
    },
  });

  // Group transactions by description for the pie chart
  const transactionGroups = transactions.reduce((acc: Record<string, { total: number, count: number, transactions: any[] }>, transaction) => {
    const description = transaction.description || 'No description';
    if (!acc[description]) {
      acc[description] = { total: 0, count: 0, transactions: [] };
    }
    acc[description].total += parseFloat(transaction.amount.toString());
    acc[description].count += 1;
    acc[description].transactions.push(transaction);
    return acc;
  }, {});

  const labels = Object.keys(transactionGroups);
  const values = Object.values(transactionGroups).map(group => group.total);
  const details = Object.entries(transactionGroups).map(([description, group]) => ({
    description,
    total: group.total,
    count: group.count,
    transactions: group.transactions
  }));

  res.json({ 
    success: true, 
    data: { 
      labels, 
      values, 
    details,
      category: category as string 
    } 
  });
});

router.get('/netWorth', async (req, res) => {
  try {
    // Get all accounts for the user
    const accounts = await Account.findAll({
      where: { userId: req.user!.id },
      attributes: ['balance']
    });

    // Get all plaid connections (credit cards are negative worth)
    const plaidItems = await PlaidItem.findAll({
      where: { userId: req.user!.id },
      attributes: ['accessToken']
    });

    // Get all assets
    const assets = await Asset.findAll({
      where: { userId: req.user!.id },
      attributes: ['valuation', 'ownershipPercentage']
    });

    var totalNetWorth = 0;

    // Calculate net worth
    const accountsTotal = accounts.reduce((sum, account) => 
      sum + parseFloat(account.balance.toString()), 0);
    totalNetWorth += accountsTotal;
    
    var plaidConnectionsTotal = 0;
    if (plaidItems && plaidItems.length > 0) {
      if (!plaidClient) {
        res.status(500).json({ error: "Plaid client not initialized" });
        return;
      }
      
      const plaidBalances = await getBalances(plaidItems, plaidClient);
      plaidConnectionsTotal = plaidBalances.reduce((sum, item) => 
        sum + (item.balances.current * (item.type === 'credit' ? -1 : 1) || 0), 0);
      totalNetWorth += plaidConnectionsTotal;
    }

    const assetsTotal = assets.reduce((sum, asset) => 
      sum + asset.valuation * (asset.ownershipPercentage / 100), 0);
    totalNetWorth += assetsTotal;

    res.json({ 
      success: true, 
      data: {
        totalNetWorth,
        breakdown: {
          accounts: accountsTotal,
          plaidConnections: plaidConnectionsTotal,
          assets: assetsTotal
        }
      }
    });
  } catch (error) {
    console.error('Error calculating net worth:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate net worth' });
  }
});

export const summariesRouter = router;