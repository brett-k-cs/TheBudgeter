import { useState } from 'react';

import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export interface NewAccountSubmitProps {
  name: string;
  type: 'checking' | 'savings' | 'credit card' | 'investment' | 'other';
  balance: number;
  description?: string;
}

interface NewAccountModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewAccountSubmitProps) => void;
}

export function NewAccountModal({ open, onClose, onSubmit }: NewAccountModalProps) {
  const [formData, setFormData] = useState<NewAccountSubmitProps>({
    name: '',
    type: 'checking',
    balance: 0,
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }

    if (formData.balance < 0) {
      newErrors.balance = 'Balance cannot be negative';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      type: 'checking',
      balance: 0,
      description: '',
    });
    setErrors({});
    onClose();
  };

  const handleChange =
    (field: keyof NewAccountSubmitProps) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
      const value = event.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: field === 'balance' ? parseFloat(value) || 0 : value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: '',
        }));
      }
    };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 500 },
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <Paper sx={{ p: 4 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}
          >
            <Typography variant="h6">Add New Account</Typography>
            <IconButton onClick={handleClose}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Account Name"
                value={formData.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                placeholder="e.g., Chase Checking, Wells Fargo Savings"
              />

              <FormControl fullWidth>
                <InputLabel>Account Type</InputLabel>
                <Select value={formData.type} onChange={handleChange('type')} label="Account Type">
                  <MenuItem value="checking">Checking</MenuItem>
                  <MenuItem value="savings">Savings</MenuItem>
                  <MenuItem value="credit card">Credit Card</MenuItem>
                  <MenuItem value="investment">Investment</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label="Initial Balance"
                value={formData.balance}
                onChange={handleChange('balance')}
                error={!!errors.balance}
                helperText={errors.balance}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
                inputProps={{
                  step: '0.01',
                  min: '0',
                }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description (Optional)"
                value={formData.description}
                onChange={handleChange('description')}
                placeholder="Add any notes about this account..."
              />

              <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                <Button type="button" variant="outlined" onClick={handleClose} sx={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" sx={{ flex: 1 }}>
                  Add Account
                </Button>
              </Stack>
            </Stack>
          </form>
        </Paper>
      </Box>
    </Modal>
  );
}
