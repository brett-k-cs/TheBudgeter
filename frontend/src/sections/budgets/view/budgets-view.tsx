import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { handleRequest } from 'src/utils/handle-request';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { BudgetItem } from '../budget-item';
import { NewBudgetModal } from '../new-budget-modal';

import type { BudgetProps } from '../budget-item';
import type { NewBudgetSubmitProps } from '../new-budget-modal';

// ----------------------------------------------------------------------

export function BudgetsView() {
  const [budgets, setBudgets] = useState<BudgetProps[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchBudgets = useCallback(async () => {
    try {
      const response = await handleRequest('/api/budgets', 'GET', setError, true);
      if (response?.success) {
        setBudgets(response.data.map((budget: { id: string; name: string; startDate: string; endDate: string; categories: any }) => ({
          id: budget.id,
          name: budget.name,
          startDate: new Date(budget.startDate),
          endDate: new Date(budget.endDate),
          categories: budget.categories,
        } as BudgetProps)
        ));
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError('Failed to fetch budgets');
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleNewBudget = useCallback(async (budgetData: NewBudgetSubmitProps) => {
    try {
      const response = await handleRequest(
        '/api/budgets',
        'POST',
        setError,
        true,
        {
          name: budgetData.name,
          startDate: budgetData.startDate.toISOString(),
          endDate: budgetData.endDate.toISOString(),
          categories: budgetData.categories,
        }
      );

      if (response?.success) {
        setOpenNew(false);
        await fetchBudgets(); // Refresh the list
      }
    } catch (err) {
      console.error('Error creating budget:', err);
      setError('Failed to create budget');
    }
  }, [fetchBudgets]);

  const handleDeleteBudget = useCallback(async (budgetId: string) => {
    try {
      const response = await handleRequest(
        `/api/budgets/${budgetId}`,
        'DELETE',
        setError,
        true
      );

      if (response?.success) {
        await fetchBudgets(); // Refresh the list
      }
    } catch (err) {
      console.error('Error deleting budget:', err);
      setError('Failed to delete budget');
    }
  }, [fetchBudgets]);

  return (
    <DashboardContent>
      <NewBudgetModal open={openNew} onClose={() => setOpenNew(false)} onSubmit={handleNewBudget} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Budgets
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setOpenNew(true)}
        >
          New Budget
        </Button>
      </Box>

      <Grid container spacing={3}>
        {budgets.map((budget) => (
          <Grid key={budget.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <BudgetItem budget={budget} onDelete={handleDeleteBudget} />
          </Grid>
        ))}
      </Grid>
    </DashboardContent>
  );
}