import dayjs from 'dayjs';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { fCurrency } from 'src/utils/format-number';

import { categories } from 'src/_mock/_categories';

import { Iconify } from 'src/components/iconify';

import { NewBudgetModal } from './new-budget-modal';
import { BudgetTransactionsModal } from './budget-transactions-modal';

// ----------------------------------------------------------------------

export interface BudgetProps {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  primary?: boolean;
  categories: {
    [categoryId: string]: {
      budgeted: number;
      spent: number;
    };
  };
}

interface BudgetItemProps {
  budget: BudgetProps;
  onDelete?: (budgetId: string) => void;
  onRefresh?: () => void;
  setError?: (msg: string) => void;
}

export function BudgetItem({ budget, onDelete, onRefresh, setError }: BudgetItemProps) {
  const [transactionsModalOpen, setTransactionsModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  // Calculate total budgeted and spent amounts
  const budgetedAmount =
    Object.values(budget.categories).reduce((total, category) => total + category.budgeted, 0) || 0;
  const spentAmount =
    Object.values(budget.categories).reduce((total, category) => total + category.spent, 0) || 0;
  const isOverBudget = spentAmount > budgetedAmount;
  const remainingAmount = budgetedAmount - spentAmount;
  const spentPercentage = budgetedAmount > 0 ? (spentAmount / budgetedAmount) * 100 : 0;

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };

    if (startDate.getFullYear() !== endDate.getFullYear()) {
      return `${startDate.toLocaleDateString('en-US', { ...options, year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
    }

    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.label : categoryId;
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this budget?')) {
      onDelete(budget.id);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setTransactionsModalOpen(true);
  };

  const handleTransactionToggle = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleSetPrimary = async () => {
    if (setError) setError('');
    
    // Call backend to set this budget as primary
    try {
      const res = await fetch(`/api/budgets/${budget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...budget, 
          categories: Object.fromEntries(
            Object.entries(budget.categories).map(([catId, cat]) => [catId, cat.budgeted])
          ), 
          primary: !budget.primary 
        }),
      });
      const data = await res.json();
      if (!res.ok && data?.error) {
        if (setError) setError(data.error);
      } else {
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      if (setError) setError('Failed to update budget.');
    }
  };

  const handleEdit = () => {
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (editData: any) => {
    if (setError) setError('');
    try {
      const res = await fetch(`/api/budgets/${budget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          startDate: editData.startDate.toISOString(),
          endDate: editData.endDate.toISOString(),
          categories: editData.categories,
        }),
      });
      const data = await res.json();
      if (!res.ok && data?.error) {
        if (setError) setError(data.error);
      } else {
        setEditModalOpen(false);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      if (setError) setError('Failed to update budget.');
    }
  };

  return (
    <Card sx={{ p: 3, height: '100%', position: 'relative' }}>
      <Box sx={{ 
        position: 'absolute', 
        top: 8, 
        right: 8, 
        display: 'flex', 
        gap: 1 
      }}>
        <IconButton
          color={budget.primary ? 'error' : 'default'}
          onClick={handleSetPrimary}
          title={budget.primary ? 'Unset Primary' : 'Set as Primary'}
        >
          <Iconify icon={budget.primary ? 'solar:star-bold' : 'solar:star-outline'} width={20} height={20} />
        </IconButton>
        <IconButton
          sx={{
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
              backgroundColor: 'primary.lighter',
            },
          }}
          onClick={handleEdit}
        >
          <Iconify icon="solar:pen-bold" width={20} height={20} />
        </IconButton>
        <IconButton
          sx={{
            color: 'text.secondary',
            '&:hover': {
              color: 'error.main',
              backgroundColor: 'error.lighter',
            },
          }}
          onClick={handleDelete}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={20} height={20} />
        </IconButton>
      </Box>

      <Stack spacing={2} sx={{ height: '100%' }}>
        <Box>
          <Typography variant="h6" noWrap>
            {budget.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDateRange(budget.startDate, budget.endDate)}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Categories
          </Typography>
          <Stack spacing={1.5}>
            {Object.entries(budget.categories).map(([categoryId, category]) => {
              const categorySpent = category.spent; // You'll need to implement this function
              const budgeted = category.budgeted;

              const spentPercentageCat = budgeted > 0 ? (categorySpent / budgeted) * 100 : 0;
              const isOverBudgetCat = categorySpent > budgeted;
              const remainingAmountCat = budgeted - categorySpent;

              return (
                <Box 
                  key={categoryId}
                  onClick={() => handleCategoryClick(categoryId)}
                  sx={{
                    cursor: 'pointer',
                    p: 1,
                    borderRadius: 1,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {getCategoryLabel(categoryId)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(spentPercentageCat)}%
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(spentPercentageCat, 100)}
                    color={
                      isOverBudgetCat ? 'error' : spentPercentageCat > 80 ? 'warning' : 'primary'
                    }
                    sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {fCurrency(categorySpent)} of {fCurrency(budgeted)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={isOverBudgetCat ? 'error.main' : 'success.main'}
                    >
                      {isOverBudgetCat
                        ? `+${fCurrency(Math.abs(remainingAmountCat))}`
                        : `${fCurrency(remainingAmountCat)} left`}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Spent
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(spentPercentage)}%
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">
              <strong>{fCurrency(spentAmount)}</strong> of {fCurrency(budgetedAmount)}
            </Typography>
            <Typography variant="body2" color={isOverBudget ? 'error.main' : 'success.main'}>
              {isOverBudget
                ? `Over by ${fCurrency(Math.abs(remainingAmount))}`
                : `${fCurrency(remainingAmount)} remaining`}
            </Typography>
          </Box>
        </Box>
      </Stack>

      <BudgetTransactionsModal
        open={transactionsModalOpen}
        onClose={() => setTransactionsModalOpen(false)}
        budgetId={budget.id}
        categoryId={selectedCategoryId}
        onTransactionToggle={handleTransactionToggle}
      />
      <NewBudgetModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initial={{
          name: budget.name,
          startDate: dayjs(budget.startDate),
          endDate: dayjs(budget.endDate),
          categories: Object.fromEntries(
            Object.entries(budget.categories).map(([catId, cat]) => [catId, cat.budgeted])
          ),
        }}
        submitLabel="Save Changes"
      />
    </Card>
  );
}
