import { useState } from 'react';

import {
  Box,
  Chip,
  Button,
  Dialog,
  Select,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
} from '@mui/material';

import { handleRequest } from 'src/utils/handle-request';

interface ExportConfig {
  format: 'json' | 'csv' | 'xml' | 'pdf';
  fields: {
    [key: string]: string;
  };
  csvDelimiter: string;
  dateFormat: string;
  includeHeaders: boolean;
  xmlRootElement: string;
  xmlItemElement: string;
  pdfTitle: string;
  pdfOrientation: 'portrait' | 'landscape';
}

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

const availableFields = [
  { id: 'date', label: 'Date' },
  { id: 'description', label: 'Description' },
  { id: 'category', label: 'Category' },
  { id: 'type', label: 'Type' },
  { id: 'amount', label: 'Amount' },
  { id: 'createdAt', label: 'Created At' },
  { id: 'updatedAt', label: 'Updated At' },
];

const dateFormatOptions = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD HH:mm:ss', label: 'YYYY-MM-DD HH:mm:ss' },
];

export function ExportModal({ open, onClose }: ExportModalProps) {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'csv',
    fields: availableFields.reduce((acc, field) => {
      if (!['createdAt', 'updatedAt'].includes(field.id))
        acc[field.id] = field.label;
      return acc;
    }, {} as { [key: string]: string }),
    csvDelimiter: ',',
    dateFormat: 'YYYY-MM-DD',
    includeHeaders: true,
    xmlRootElement: 'transactions',
    xmlItemElement: 'transaction',
    pdfTitle: 'Transaction Report',
    pdfOrientation: 'portrait',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfigChange = (key: keyof ExportConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleFieldToggle = (fieldId: string) => {
    if (!availableFields.some(field => field.id === fieldId)) return;
    // Toggle field selection

    if (config.fields[fieldId]) {
      const newFields = { ...config.fields };
      delete newFields[fieldId];
      setConfig(prev => ({ ...prev, fields: newFields }));
    } else {
      setConfig(prev => ({
        ...prev,
        fields: { ...prev.fields, [fieldId]: availableFields.find(field => field.id === fieldId)?.label || '' },
      }));
    }
  };

  const handleFieldChange = (fieldId: string, newValue: string) => {
    setConfig(prev => ({
      ...prev,
      fields: { ...prev.fields, [fieldId]: newValue },
    }));
  };

  const handleExport = async () => {
    if (Object.keys(config.fields).length === 0) {
      setError('Please select at least one field to export');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await handleRequest('/api/transactions/export', 'POST', setError, true, config, 'response');
      if (!response) {
        return; // Handle case where response is undefined, setError will already be called
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Handle file download
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `transactions.${config.format}`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during export');
    } finally {
      setLoading(false);
    }
  };

  const renderFormatSpecificOptions = () => {
    switch (config.format) {
      case 'csv':
        return (
          <>
            <TextField
              label="CSV Delimiter"
              value={config.csvDelimiter}
              onChange={(e) => handleConfigChange('csvDelimiter', e.target.value)}
              size="small"
              helperText="Character to separate values (e.g., comma, semicolon, tab)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={config.includeHeaders}
                  onChange={(e) => handleConfigChange('includeHeaders', e.target.checked)}
                />
              }
              label="Include Headers"
            />
          </>
        );
      case 'xml':
        return (
          <>
            <TextField
              label="Root Element Name"
              value={config.xmlRootElement}
              onChange={(e) => handleConfigChange('xmlRootElement', e.target.value)}
              size="small"
            />
            <TextField
              label="Item Element Name"
              value={config.xmlItemElement}
              onChange={(e) => handleConfigChange('xmlItemElement', e.target.value)}
              size="small"
            />
          </>
        );
      case 'pdf':
        return (
          <>
            <TextField
              label="PDF Title"
              value={config.pdfTitle}
              onChange={(e) => handleConfigChange('pdfTitle', e.target.value)}
              size="small"
            />
            <FormControl size="small">
              <InputLabel>Orientation</InputLabel>
              <Select
                value={config.pdfOrientation}
                label="Orientation"
                onChange={(e) => handleConfigChange('pdfOrientation', e.target.value)}
              >
                <MenuItem value="portrait">Portrait</MenuItem>
                <MenuItem value="landscape">Landscape</MenuItem>
              </Select>
            </FormControl>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Export Transactions</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Format Selection */}
        <FormControl size="small" sx={{ mt: 1 }}>
          <InputLabel>Export Format</InputLabel>
          <Select
            value={config.format}
            label="Export Format"
            onChange={(e) => handleConfigChange('format', e.target.value)}
          >
            <MenuItem value="json">JSON</MenuItem>
            <MenuItem value="csv">CSV</MenuItem>
            <MenuItem value="xml">XML</MenuItem>
            <MenuItem value="pdf">PDF</MenuItem>
          </Select>
        </FormControl>

        {/* Field Selection */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Select Fields to Export
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {availableFields.map((field) => (
              <Chip
                key={field.id}
                label={field.label}
                clickable
                color={Object.keys(config.fields).includes(field.id) ? 'primary' : 'default'}
                onClick={() => handleFieldToggle(field.id)}
                variant={Object.keys(config.fields).includes(field.id) ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        {/* Key Naming */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Key Naming
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {availableFields.filter(a => Object.keys(config.fields).includes(a.id)).map((field) => (
              <FormControl key={field.id} sx={{ width: '30%', minWidth: '200px' }}>
                <Typography variant='body2' gutterBottom>
                  {field.label}
                </Typography>
                <TextField
                  value={config.fields[field.id] || ''}
                  onChange={(e) => {
                    // Handle the change - you'll need to update your config state
                    // This assumes you have a function to update config.fields
                    handleFieldChange(field.id, e.target.value);
                  }}
                  size="small"
                  variant="outlined"
                />
              </FormControl>
            ))}
          </Box>
        </Box>

        {/* Date Format */}
        <FormControl size="small">
          <InputLabel>Date Format</InputLabel>
          <Select
            value={config.dateFormat}
            label="Date Format"
            onChange={(e) => handleConfigChange('dateFormat', e.target.value)}
          >
            {dateFormatOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Format-specific options */}
        {renderFormatSpecificOptions()}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={loading || Object.keys(config.fields).length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}