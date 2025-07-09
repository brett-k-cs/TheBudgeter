import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { _budgets } from 'src/_mock/_budgets';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { BudgetItem } from '../budget-item';
import { NewBudgetModal } from '../new-budget-modal';

import type { BudgetProps } from '../budget-item';
import type { NewBudgetSubmitProps } from '../new-budget-modal';

// ----------------------------------------------------------------------

export function BudgetsView() {
  const [budgets, setBudgets] = useState<BudgetProps[]>(_budgets);
  const [openNew, setOpenNew] = useState(false);

  const handleNewBudget = useCallback((budgetData: NewBudgetSubmitProps) => {
    const newCategories: { [key: string]: { budgeted: number; spent: number } } = {};
    Object.keys(budgetData.categories).forEach((categoryId) => {
      newCategories[categoryId] = {
        budgeted: budgetData.categories[categoryId],
        spent: 0,
      };
    });
    
    const newBudget: BudgetProps = {
      id: Date.now().toString(),
      name: budgetData.name,
      startDate: budgetData.startDate.toDate(),
      endDate: budgetData.endDate.toDate(),
      categories: newCategories
    };

    setBudgets((prev) => [...prev, newBudget]);
    setOpenNew(false);
  }, []);

  return (
    <DashboardContent>
      <NewBudgetModal open={openNew} onClose={() => setOpenNew(false)} onSubmit={handleNewBudget} />

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
            <BudgetItem budget={budget} />
          </Grid>
        ))}
      </Grid>
    </DashboardContent>
  );
}
