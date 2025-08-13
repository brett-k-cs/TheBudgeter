import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Modal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';

import { fCurrency } from 'src/utils/format-number';
import { handleRequest } from 'src/utils/handle-request';

import { Iconify } from 'src/components/iconify';

import type { AssetProps } from './asset-item';

// ----------------------------------------------------------------------

interface AssetHistoryEntry {
  id: number;
  valuation: number;
  createdAt: string;
}

interface AssetDetailsModalProps {
  open: boolean;
  onClose: () => void;
  asset: AssetProps;
  onUpdate: (assetData: Partial<AssetProps>) => void;
  onDelete: () => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

export function AssetDetailsModal({
  open,
  onClose,
  asset,
  onUpdate,
  onDelete,
  isEditing,
  setIsEditing,
}: AssetDetailsModalProps) {
  const [history, setHistory] = useState<AssetHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [formData, setFormData] = useState({
    name: asset.name,
    type: asset.type,
    valuation: asset.valuation,
    ownershipPercentage: asset.ownershipPercentage || 100,
    description: asset.description || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load asset history when modal opens
  useEffect(() => {
    const fetchAssetHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await handleRequest(
          `/api/assets/${asset.id}/history`,
          'GET',
          () => {},
          true
        );
        if (response?.success) {
          setHistory(response.data);
        }
      } catch (err) {
        console.error('Error fetching asset history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    if (open) {
      fetchAssetHistory();
      setFormData({
        name: asset.name,
        type: asset.type,
        valuation: asset.valuation,
        ownershipPercentage: asset.ownershipPercentage || 100,
        description: asset.description || '',
      });
      setErrors({});
    }
  }, [open, asset]);

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

    if (formData.ownershipPercentage < 0 || formData.ownershipPercentage > 100) {
      newErrors.ownershipPercentage = 'Ownership percentage must be between 0 and 100';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onUpdate({
      name: formData.name,
      type: formData.type,
      valuation: formData.valuation,
      ownershipPercentage: formData.ownershipPercentage,
      description: formData.description,
    });

    setIsEditing(false);
  };

  const handleClose = () => {
    setIsEditing(false);
    setErrors({});
    onClose();
  };

  const getAssetTypeLabel = (type: AssetProps['type']) => {
    switch (type) {
      case 'property':
        return 'Property';
      case 'automobile':
        return 'Automobile';
      case 'collectibles':
        return 'Collectibles';
      case 'other':
        return 'Other';
      default:
        return 'Unknown';
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Paper
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 700 },
          maxHeight: '90vh',
          overflow: 'auto',
          p: 4,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h4">Asset Details</Typography>
          <IconButton onClick={handleClose}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Stack>

        {!isEditing ? (
          <Stack spacing={3}>
            {/* Asset Info */}
            <Box>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {asset.name}
              </Typography>
              <Chip
                label={getAssetTypeLabel(asset.type)}
                size="small"
                color="primary"
                sx={{ mb: 2 }}
              />
              <Typography variant="h3" sx={{ mb: 1, color: 'primary.main' }}>
                {fCurrency(asset.valuation)}
              </Typography>
              {asset.ownershipPercentage !== undefined && asset.ownershipPercentage !== 100 && (
                <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Ownership: {asset.ownershipPercentage}%
                </Typography>
              )}
              {asset.description && (
                <Typography variant="body1" color="text.secondary">
                  {asset.description}
                </Typography>
              )}
            </Box>

            <Divider />

            {/* History Section */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Valuation History
              </Typography>

              {loadingHistory ? (
                <Typography variant="body2" color="text.secondary">
                  Loading history...
                </Typography>
              ) : history.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Valuation</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell align="right">{fCurrency(entry.valuation)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No valuation history available
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="error"
                startIcon={<Iconify icon="mingcute:delete-2-line" />}
                onClick={() => {
                  onDelete();
                  handleClose();
                }}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:edit-line" />}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            </Stack>
          </Stack>
        ) : (
          /* Edit Form */
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
                    setFormData({ ...formData, type: e.target.value as AssetProps['type'] })
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
                InputProps={{
                  startAdornment: '$',
                }}
              />

              <TextField
                fullWidth
                label="Ownership Percentage"
                type="number"
                value={formData.ownershipPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ownershipPercentage: parseFloat(e.target.value) || 100,
                  })
                }
                error={!!errors.ownershipPercentage}
                helperText={errors.ownershipPercentage}
                InputProps={{
                  endAdornment: '%',
                  inputProps: { min: 0, max: 100, step: 0.1 },
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
                <Button variant="outlined" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained">
                  Save Changes
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}
      </Paper>
    </Modal>
  );
}
