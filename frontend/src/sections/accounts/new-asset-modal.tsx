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

export interface NewAssetSubmitProps {
  name: string;
  type: 'property' | 'automobile' | 'collectibles' | 'other';
  valuation: number;
  ownershipPercentage: number;
  description?: string;
}

interface NewAssetModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewAssetSubmitProps) => void;
}

export function NewAssetModal({ open, onClose, onSubmit }: NewAssetModalProps) {
  const [formData, setFormData] = useState<NewAssetSubmitProps>({
    name: '',
    type: 'other',
    valuation: 0,
    ownershipPercentage: 100,
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required';
    }

    if (formData.valuation < 0) {
      newErrors.valuation = 'Valuation must be positive';
    }

    if (
      formData.ownershipPercentage !== undefined &&
      (formData.ownershipPercentage < 0 || formData.ownershipPercentage > 100)
    ) {
      newErrors.ownershipPercentage = 'Ownership percentage must be between 0 and 100';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      type: 'other',
      valuation: 0,
      ownershipPercentage: 100,
      description: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Paper
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 500 },
          p: 4,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h4">Add New Asset</Typography>
          <IconButton onClick={handleClose}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Stack>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Asset Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!errors.name}
              helperText={errors.name}
            />

            <FormControl fullWidth error={!!errors.type}>
              <InputLabel>Asset Type</InputLabel>
              <Select
                value={formData.type}
                label="Asset Type"
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as NewAssetSubmitProps['type'] })
                }
              >
                <MenuItem value="property">Property</MenuItem>
                <MenuItem value="automobile">Automobile</MenuItem>
                <MenuItem value="collectibles">Collectibles</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Valuation"
              type="number"
              value={formData.valuation}
              onChange={(e) =>
                setFormData({ ...formData, valuation: parseFloat(e.target.value) || 0 })
              }
              error={!!errors.valuation}
              helperText={errors.valuation}
              slotProps={{
                input: {
                  startAdornment: '$',
                  type: 'number',
                  inputMode: 'numeric',
                },
              }}
            />

            <TextField
              fullWidth
              label="Ownership Percentage"
              type="number"
              value={formData.ownershipPercentage}
              onChange={(e) =>
                setFormData({ ...formData, ownershipPercentage: parseFloat(e.target.value) || 100 })
              }
              error={!!errors.ownershipPercentage}
              helperText={errors.ownershipPercentage}
              slotProps={{
                input: {
                  endAdornment: '%',
                  type: 'number',
                  inputMode: 'numeric',
                  inputProps: { min: 0, max: 100, step: 0.1 },
                },
              }}
            />

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="contained">
                Add Asset
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Modal>
  );
}
