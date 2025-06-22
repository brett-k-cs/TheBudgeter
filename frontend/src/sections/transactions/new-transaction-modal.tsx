import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { useState } from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Grid,
  Radio,
  Dialog,
  Button,
  Select,
  MenuItem,
  FormLabel,
  TextField,
  Typography,
  RadioGroup,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
} from '@mui/material';

import { categories } from 'src/_mock/_categories';

import { MoneyInput } from 'src/components/money-input/money-input';

export type NewTransactionSubmitProps = {
  date: Dayjs,
  type: 'withdrawal' | 'deposit',
  description: string,
  category: string
  amount: number,
}

type NewTransactionModalProps = {
  open: boolean,
  onClose: () => void,
  onSubmit: ({ type, amount, description, category, date } : NewTransactionSubmitProps) => void
}

export function NewTransactionModal({ onClose, onSubmit, open = true } : NewTransactionModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<'withdrawal' | 'deposit'>('withdrawal');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState<Dayjs>(dayjs());

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setType(event.target.value as 'withdrawal' | 'deposit');
  };

  const handleSubmit = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!description) {
      setError('Please enter a description');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }
    if (!date) {
      setError('Please select a date');
      return;
    }

    onSubmit({ amount: parseFloat(amount), type, description, category, date });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Transaction</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        { error && (
          <Typography color="error" variant="body2" style={{ textAlign: 'center' }}>
            {error}
          </Typography>
        )}
        <Grid container spacing={2} alignItems="center">
          <Grid size={{xs: 12, md: 6, lg: 6}}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Transaction Type</FormLabel>
              <RadioGroup
                row
                value={type}
                onChange={handleTypeChange}
                name="transaction-type"
              >
                <FormControlLabel
                  value="withdrawal"
                  control={<Radio />}
                  label="Withdrawal"
                />
                <FormControlLabel
                  value="deposit"
                  control={<Radio />}
                  label="Deposit"
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid size={{xs: 12, md: 6, lg: 6}}>
            <MoneyInput
              value={amount}
              setValue={setAmount}
              sx={{ marginTop: "0.5rem" }}
              label="Amount"
              fullWidth
              error={error == 'Please enter a valid amount'}
            />
          </Grid>
        </Grid>
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          error={error === 'Please enter a description'}
        />
        <FormControl fullWidth>
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            value={category}
            label="Category"
            onChange={(e) => setCategory(e.target.value)}
            error={error === 'Please select a category'}
            fullWidth
          >
            {
              categories.map(cat => (
                <MenuItem value={cat.id}>{cat.label}</MenuItem>
              ))
            }
          </Select>
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
            label="Transaction Date"
            value={date}
            onChange={(newDate) => newDate && setDate(newDate)}
            viewRenderers={{
              hours: renderTimeViewClock,
              minutes: renderTimeViewClock,
              seconds: renderTimeViewClock,
            }}
          />
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
}