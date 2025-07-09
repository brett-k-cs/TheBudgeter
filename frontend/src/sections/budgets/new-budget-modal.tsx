import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { useState } from 'react';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Box,
  Grid,
  Dialog,
  Button,
  Select,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { categories } from 'src/_mock/_categories';

import { Iconify } from 'src/components/iconify';
import { MoneyInput } from 'src/components/money-input/money-input';

type CategoryBudget = {
  id: string; // unique identifier for this row
  categoryId: string;
  amount: string;
};

export type NewBudgetSubmitProps = {
  name: string;
  startDate: Dayjs;
  endDate: Dayjs;
  categories: {
    [key: string]: number; // category ID to budgeted amount
  }
};

type NewBudgetModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (budgetData: NewBudgetSubmitProps) => void;
};

export function NewBudgetModal({ onClose, onSubmit, open = false }: NewBudgetModalProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs().endOf('month'));
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([
   { id: '1', categoryId: '', amount: '0' }
  ]);

  const [error, setError] = useState<string | null>(null);

 const handleClose = () => {
    setName('');
    setStartDate(dayjs().startOf('month'));
    setEndDate(dayjs().endOf('month'));
    setCategoryBudgets([{ id: '1', categoryId: '', amount: '0' }]);
    setError('');
    onClose();
  };

  const addCategoryBudget = () => {
    setCategoryBudgets(prev => [
      ...prev,
      { id: Date.now().toString(), categoryId: '', amount: '0' }
    ]);
  };

  const removeCategoryBudget = (id: string) => {
    setCategoryBudgets(prev => prev.filter(item => item.id !== id));
  };

  const updateCategoryBudget = (id: string, field: 'categoryId' | 'amount', value: string | number) => {
    setCategoryBudgets(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Ensure there's always an empty row
  const hasEmptyRow = categoryBudgets.some(item => item.categoryId === '' || item.amount === '0');
  if (!hasEmptyRow) {
    addCategoryBudget();
  }

  const handleSubmit = () => {
    // Validation
    if (!name.trim()) {
      setError('Please enter a budget name');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }
    if (endDate.isBefore(startDate)) {
      setError('End date must be after start date');
      return;
    }

    // Filter out empty rows and create categories object
    const validBudgets = categoryBudgets.filter(item => 
      item.categoryId !== '' && parseFloat(item.amount.replace(/[^0-9.-]+/g, '')) > 0
    );

    if (validBudgets.length === 0) {
      setError('Please add at least one category budget');
      return;
    }

    // Check for duplicate categories
    const categoryIds = validBudgets.map(item => item.categoryId);
    const uniqueCategories = new Set(categoryIds);
    if (categoryIds.length !== uniqueCategories.size) {
      setError('Each category can only be budgeted once');
      return;
    }

    // Create the categories object
    const categoriesObject = validBudgets.reduce((acc, item) => ({
      ...acc,
      [item.categoryId]: parseFloat(item.amount.replace(/[^0-9.-]+/g, '')) // Remove currency symbols and format
    }), {});

    const submitData: NewBudgetSubmitProps = {
      name,
      startDate,
      endDate,
      categories: categoriesObject
    };

    onSubmit(submitData);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Budget</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {error && (
          <Typography color="error" variant="body2" style={{ textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        <TextField
          label="Budget Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          error={error === 'Please enter a budget name'}
          placeholder="e.g., Monthly Groceries, Q1 Entertainment"
        />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newDate) => newDate && setStartDate(newDate)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newDate) => newDate && setEndDate(newDate)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>

        <Box>
          <Typography variant="h6" gutterBottom>
            Category Budgets
          </Typography>
          {categoryBudgets.map((budget, index) => (
            <Grid container spacing={2} key={budget.id} sx={{ mb: 1, alignItems: 'center' }}>
              <Grid size={{ xs: 12, md: 5 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={budget.categoryId}
                    onChange={(e) => updateCategoryBudget(budget.id, 'categoryId', e.target.value)}
                    label="Category"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 10, md: 5 }}>
                <MoneyInput
                  value={budget.amount}
                  setValue={(value) => updateCategoryBudget(budget.id, 'amount', value)}
                  label="Amount"
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 2, md: 2 }}>
                {categoryBudgets.length > 1 && (
                  <IconButton 
                    onClick={() => removeCategoryBudget(budget.id)}
                    color="error"
                    size="small"
                  >
                    <Iconify width={22} icon="solar:trash-bin-trash-outline" />
                  </IconButton>
                )}
              </Grid>
            </Grid>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Create Budget
        </Button>
      </DialogActions>
    </Dialog>
  );
}