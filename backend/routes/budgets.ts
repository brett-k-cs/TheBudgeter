import { Request, Response, Router } from 'express';
import { Op } from 'sequelize';

import { Budget } from '../models/budget.js';
import { Transaction } from '../models/transaction.js';
import { BudgetCategory } from '../models/budgetCategory.js';
import { BudgetTransactionExclusion } from '../models/budgetTransactionExclusion.js';

const router = Router();

interface BudgetRequestBody {
  name: string;
  startDate: string;
  endDate: string;
  categories: { [categoryId: string]: number };
  primary?: boolean;
}

router.get('/primary', async (req, res) => {
  try {
    const now = new Date();
    const budget = await Budget.findOne({
      where: {
        userId: req.user!.id,
        primary: true,
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now },
      },
      include: [
        {
          model: BudgetCategory,
          as: 'budgetCategories',
          attributes: ['categoryId', 'budgetedAmount'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    if (!budget) {
      res.json({ success: true, data: null });
      return;
    }

    // Calculate spent amounts for each category
    const categories: { [key: string]: { budgeted: number; spent: number } } = {};
    const excludedTransactions = await BudgetTransactionExclusion.findAll({
      where: { budgetId: budget.id },
      attributes: ['transactionId'],
    });
    const excludedTransactionIds = excludedTransactions.map(exc => exc.transactionId);

    for (const budgetCategory of budget.budgetCategories!) {
      const spent = await Transaction.sum('amount', {
        where: {
          userId: req.user!.id,
          category: budgetCategory.categoryId,
          type: 'withdrawal',
          date: {
            [Op.between]: [budget.startDate, budget.endDate],
          },
          id: {
            [Op.notIn]: excludedTransactionIds.length > 0 ? excludedTransactionIds : [0],
          },
        },
      });

      categories[budgetCategory.categoryId] = {
        budgeted: parseFloat(parseFloat(budgetCategory.budgetedAmount.toString()).toFixed(2)),
        spent: parseFloat((spent || 0).toFixed(2)),
      };
    }

    res.json({
      success: true,
      data: {
        id: budget.id.toString(),
        name: budget.name,
        startDate: budget.startDate,
        endDate: budget.endDate,
        primary: budget.primary,
        categories,
      },
    });
  } catch (error) {
    console.error('Error fetching primary budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all budgets for user
router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.findAll({
      where: { userId: req.user!.id },
      include: [
        {
          model: BudgetCategory,
          as: 'budgetCategories',
          attributes: ['categoryId', 'budgetedAmount'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Calculate spent amounts for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const categories: { [key: string]: { budgeted: number; spent: number } } = {};
        
        // Get excluded transaction IDs for this budget
        const excludedTransactions = await BudgetTransactionExclusion.findAll({
          where: { budgetId: budget.id },
          attributes: ['transactionId'],
        });
        const excludedTransactionIds = excludedTransactions.map(exc => exc.transactionId);
        
        for (const budgetCategory of budget.budgetCategories!) {
          const spent = await Transaction.sum('amount', {
            where: {
              userId: req.user!.id,
              category: budgetCategory.categoryId,
              type: 'withdrawal',
              date: {
                [Op.between]: [budget.startDate, budget.endDate],
              },
              id: {
                [Op.notIn]: excludedTransactionIds.length > 0 ? excludedTransactionIds : [0], // Use [0] as fallback to avoid empty array
              },
            },
          });

          categories[budgetCategory.categoryId] = {
            budgeted: parseFloat(budgetCategory.budgetedAmount.toString()),
            spent: spent || 0,
          };
        }

        return {
          id: budget.id.toString(),
          name: budget.name,
          startDate: budget.startDate,
          endDate: budget.endDate,
          primary: budget.primary,
          categories,
        };
      })
    );

    res.json({ success: true, data: budgetsWithSpent });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new budget
router.post('/', async (req: Request<{}, {}, BudgetRequestBody>, res: Response) => {
  const { name, startDate, endDate, categories, primary } = req.body;

  if (!name || !startDate || !endDate || !categories) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    if (primary) {
      // Check for overlapping primary budgets for this user
      const overlappingPrimary = await Budget.findOne({
        where: {
          userId: req.user!.id,
          primary: true,
          [Op.or]: [
            {
              startDate: { [Op.between]: [startDate, endDate] },
            },
            {
              endDate: { [Op.between]: [startDate, endDate] },
            },
            {
              startDate: { [Op.lte]: startDate },
              endDate: { [Op.gte]: endDate },
            },
          ],
        },
      });
      if (overlappingPrimary) {
        res.status(400).json({ error: 'Another primary budget overlaps this period.' });
        return;
      }
    }

    const budget = await Budget.create({
      userId: req.user!.id,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      primary: !!primary,
    });

    // Create budget categories
    const budgetCategories = Object.entries(categories).map(([categoryId, amount]) => ({
      budgetId: budget.id,
      categoryId,
      budgetedAmount: amount,
    }));

    await BudgetCategory.bulkCreate(budgetCategories);

    res.status(201).json({ success: true, data: { id: budget.id } });
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transactions for a budget category
router.get('/:id/categories/:categoryId/transactions', async (req: Request<{ id: string; categoryId: string }>, res: Response) => {
  const budgetId = parseInt(req.params.id, 10);
  const { categoryId } = req.params;
  
  if (isNaN(budgetId)) {
    res.status(400).json({ error: 'Invalid budget ID' });
    return;
  }

  try {
    const budget = await Budget.findByPk(budgetId);
    
    if (!budget) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    if (budget.userId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Get all transactions for this category within the budget period
    const transactions = await Transaction.findAll({
      where: {
        userId: req.user!.id,
        category: categoryId,
        type: 'withdrawal',
        date: {
          [Op.between]: [budget.startDate, budget.endDate],
        },
      },
      order: [['date', 'DESC']],
      attributes: ['id', 'amount', 'description', 'date'],
    });

    // Get excluded transaction IDs for this budget
    const excludedTransactions = await BudgetTransactionExclusion.findAll({
      where: { 
        budgetId: budget.id,
        transactionId: {
          [Op.in]: transactions.map(t => t.id)
        }
      },
      attributes: ['transactionId'],
    });
    const excludedTransactionIds = new Set(excludedTransactions.map(exc => exc.transactionId));

    // Add exclusion status to transactions
    const transactionsWithExclusion = transactions.map(transaction => ({
      id: transaction.id,
      amount: parseFloat(transaction.amount.toString()),
      description: transaction.description,
      date: transaction.date,
      excluded: excludedTransactionIds.has(transaction.id),
    }));

    res.json({ success: true, data: transactionsWithExclusion });
  } catch (error) {
    console.error('Error fetching budget category transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle transaction exclusion for a budget
router.post('/:id/transactions/:transactionId/toggle-exclusion', async (req: Request<{ id: string; transactionId: string }>, res: Response) => {
  const budgetId = parseInt(req.params.id, 10);
  const transactionId = parseInt(req.params.transactionId, 10);
  
  if (isNaN(budgetId) || isNaN(transactionId)) {
    res.status(400).json({ error: 'Invalid budget ID or transaction ID' });
    return;
  }

  try {
    const budget = await Budget.findByPk(budgetId);
    
    if (!budget) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    if (budget.userId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Verify the transaction belongs to the user and is within the budget period
    const transaction = await Transaction.findOne({
      where: {
        id: transactionId,
        userId: req.user!.id,
        date: {
          [Op.between]: [budget.startDate, budget.endDate],
        },
      },
    });

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found or not within budget period' });
      return;
    }

    // Check if exclusion already exists
    const existingExclusion = await BudgetTransactionExclusion.findOne({
      where: {
        budgetId: budget.id,
        transactionId: transaction.id,
      },
    });

    let excluded: boolean;

    if (existingExclusion) {
      // Remove exclusion
      await existingExclusion.destroy();
      excluded = false;
    } else {
      // Add exclusion
      await BudgetTransactionExclusion.create({
        budgetId: budget.id,
        transactionId: transaction.id,
      });
      excluded = true;
    }

    res.json({ success: true, data: { excluded } });
  } catch (error) {
    console.error('Error toggling transaction exclusion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req: Request<{ id: string }, {}, Partial<BudgetRequestBody>>, res: Response) => {
  const budgetId = parseInt(req.params.id, 10);
  const { name, startDate, endDate, primary, categories } = req.body;

  if (isNaN(budgetId)) {
    res.status(400).json({ error: 'Invalid budget ID' });
    return;
  }

  try {
    const budget = await Budget.findByPk(budgetId, {
      include: [
        {
          model: BudgetCategory,
          as: 'budgetCategories',
        },
      ],
    });

    if (!budget) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    if (budget.userId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Update basic properties if provided
    if (name !== undefined) budget.name = name;
    
    let newStartDate = budget.startDate;
    let newEndDate = budget.endDate;
    
    if (startDate) newStartDate = new Date(startDate);
    if (endDate) newEndDate = new Date(endDate);

    // Check for primary budget conflicts if needed
    if ((primary === true || budget.primary) && (startDate || endDate)) {
      const overlappingPrimary = await Budget.findOne({
        where: {
          userId: req.user!.id,
          primary: true,
          id: { [Op.ne]: budgetId },
          [Op.or]: [
            {
              startDate: { [Op.between]: [newStartDate, newEndDate] },
            },
            {
              endDate: { [Op.between]: [newStartDate, newEndDate] },
            },
            {
              startDate: { [Op.lte]: newStartDate },
              endDate: { [Op.gte]: newEndDate },
            },
          ],
        },
      });
      console.log('Overlapping primary budget:', overlappingPrimary);
      if (overlappingPrimary) {
        res.status(400).json({ error: 'Another primary budget overlaps this period.' });
        return;
      }
    }
    
    budget.startDate = newStartDate;
    budget.endDate = newEndDate;
    
    if (typeof primary === 'boolean') {
      budget.primary = primary;
    }

    await budget.save();

    // Update budget categories if provided
    if (categories) {
      // Delete existing categories
      await BudgetCategory.destroy({
        where: { budgetId: budget.id }
      });
      
      // Create new budget categories
      const budgetCategories = Object.entries(categories).map(([categoryId, amount]) => ({
        budgetId: budget.id,
        categoryId,
        budgetedAmount: amount,
      }));

      await BudgetCategory.bulkCreate(budgetCategories);
    }

    res.json({ 
      success: true, 
      data: { 
        id: budget.id, 
        name: budget.name,
        startDate: budget.startDate,
        endDate: budget.endDate,
        primary: budget.primary 
      } 
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete budget
router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const budgetId = parseInt(req.params.id, 10);
  
  if (isNaN(budgetId)) {
    res.status(400).json({ error: 'Invalid budget ID' });
    return;
  }

  try {
    const budget = await Budget.findByPk(budgetId);
    
    if (!budget) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    if (budget.userId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await budget.destroy();
    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const budgetsRouter = router;
