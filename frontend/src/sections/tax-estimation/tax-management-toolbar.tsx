import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import { 
  clearAllTaxCategories, 
  exportTaxCategories, 
  importTaxCategories 
} from 'src/utils/tax-storage';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type TaxManagementToolbarProps = {
  onClearAll: () => void;
  onForceRefresh: () => void;
  selectedCount?: number;
  onBulkTaxCategoryChange?: (category: 'w2' | '1099' | 'none') => void;
};

export function TaxManagementToolbar({ 
  onClearAll, 
  onForceRefresh,
  selectedCount = 0, 
  onBulkTaxCategoryChange 
}: TaxManagementToolbarProps) {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const handleExport = () => {
    const data = exportTaxCategories();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tax-categories-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (importTaxCategories(importText)) {
      setImportDialogOpen(false);
      setImportText('');
      onForceRefresh(); // Trigger refresh
      // You might want to show a success message here
    } else {
      // You might want to show an error message here
      alert('Failed to import tax categories. Please check the format.');
    }
  };

  const handleClearAll = () => {
    clearAllTaxCategories();
    setClearDialogOpen(false);
    onClearAll();
  };

  return (
    <>
      <Card sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Tax Category Management
            {selectedCount > 0 && (
              <Typography component="span" variant="body2" color="primary" sx={{ ml: 1 }}>
                ({selectedCount} selected)
              </Typography>
            )}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedCount > 0 && onBulkTaxCategoryChange && (
              <>
                <Tooltip title="Set selected transactions to W-2 income">
                  <Button
                    variant="contained"
                    size="small"
                    color="info"
                    onClick={() => onBulkTaxCategoryChange('w2')}
                  >
                    Set W-2
                  </Button>
                </Tooltip>

                <Tooltip title="Set selected transactions to 1099 income">
                  <Button
                    variant="contained"
                    size="small"
                    color="warning"
                    onClick={() => onBulkTaxCategoryChange('1099')}
                  >
                    Set 1099
                  </Button>
                </Tooltip>

                <Tooltip title="Clear tax category for selected transactions">
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => onBulkTaxCategoryChange('none')}
                  >
                    Clear Tax
                  </Button>
                </Tooltip>
              </>
            )}
            <Tooltip title="Export tax categories to JSON file">
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:export-bold" />}
                onClick={handleExport}
              >
                Export
              </Button>
            </Tooltip>

            <Tooltip title="Import tax categories from JSON">
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:import-bold" />}
                onClick={() => setImportDialogOpen(true)}
              >
                Import
              </Button>
            </Tooltip>

            <Tooltip title="Clear all tax categories">
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                onClick={() => setClearDialogOpen(true)}
              >
                Clear All
              </Button>
            </Tooltip>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Assign tax categories to income transactions to estimate your tax liability. 
          Categories are saved locally in your browser.
          {selectedCount > 0 && (
            <Typography component="span" variant="body2" color="primary" sx={{ display: 'block', mt: 0.5 }}>
              Tip: Select multiple transactions and use the bulk action buttons above to assign tax categories quickly.
            </Typography>
          )}
        </Typography>
      </Card>

      {/* Clear All Confirmation Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        aria-labelledby="clear-dialog-title"
        aria-describedby="clear-dialog-description"
      >
        <DialogTitle id="clear-dialog-title">Clear All Tax Categories?</DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-dialog-description">
            This will remove all tax category assignments from your transactions. 
            This action cannot be undone. Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClearAll} color="error" variant="contained">
            Clear All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        aria-labelledby="import-dialog-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="import-dialog-title">Import Tax Categories</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Paste the JSON data from a previously exported tax categories file:
          </DialogContentText>
          <TextField
            multiline
            rows={10}
            fullWidth
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste JSON data here..."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleImport} 
            variant="contained"
            disabled={!importText.trim()}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
