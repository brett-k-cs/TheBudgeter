import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';
import { handleRequest } from 'src/utils/handle-request';

import { categories } from 'src/_mock/_categories';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface BudgetTransaction {
  id: number;
  amount: number;
  description: string;
  date: string;
  excluded: boolean;
}

interface BudgetTransactionsModalProps {
  open: boolean;
  onClose: () => void;
  budgetId: string;
  categoryId: string;
  onTransactionToggle?: () => void;
}

export function BudgetTransactionsModal({
  open,
  onClose,
  budgetId,
  categoryId,
  onTransactionToggle,
}: BudgetTransactionsModalProps) {
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const getCategoryLabel = (catId: string) => {
    const category = categories.find((cat) => cat.id === catId);
    return category ? category.label : catId;
  };

  const fetchTransactions = useCallback(async () => {
    if (!open || !budgetId || !categoryId) return;

    setLoading(true);
    setError('');

    try {
      const response = await handleRequest(
        `/api/budgets/${budgetId}/categories/${categoryId}/transactions`,
        'GET',
        setError,
        true
      );

      if (response?.success) {
        setTransactions(response.data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [open, budgetId, categoryId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleToggleExclusion = async (transactionId: number) => {
    try {
      const response = await handleRequest(
        `/api/budgets/${budgetId}/transactions/${transactionId}/toggle-exclusion`,
        'POST',
        setError,
        true
      );

      if (response?.success) {
        // Update the local state
        setTransactions(prev =>
          prev.map(transaction =>
            transaction.id === transactionId
              ? { ...transaction, excluded: response.data.excluded }
              : transaction
          )
        );

        // Notify parent component to refresh budget data
        if (onTransactionToggle) {
          onTransactionToggle();
        }
      }
    } catch (err) {
      console.error('Error toggling transaction exclusion:', err);
      setError('Failed to update transaction exclusion');
    }
  };

  const handleClose = () => {
    setTransactions([]);
    setError('');
    onClose();
  };

  const includedTransactions = transactions.filter(t => !t.excluded);
  const excludedTransactions = transactions.filter(t => t.excluded);
  const totalIncluded = includedTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExcluded = excludedTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: '80%', md: '70%', lg: '60%' },
          maxWidth: 800,
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {getCategoryLabel(categoryId)} Transactions
            </Typography>
            <IconButton onClick={handleClose}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Stack>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Summary */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Included in Budget
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {fCurrency(totalIncluded)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {includedTransactions.length} transactions
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Excluded from Budget
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {fCurrency(totalExcluded)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {excludedTransactions.length} transactions
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Transactions Table */}
              {transactions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No transactions found for this category in the budget period.
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">Include</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow
                          key={transaction.id}
                          sx={{
                            opacity: transaction.excluded ? 0.5 : 1,
                            textDecoration: transaction.excluded ? 'line-through' : 'none',
                            bgcolor: transaction.excluded ? 'action.hover' : 'transparent',
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={!transaction.excluded}
                              onChange={() => handleToggleExclusion(transaction.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {fDate(transaction.date)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                textDecoration: transaction.excluded ? 'line-through' : 'none',
                              }}
                            >
                              {transaction.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              sx={{
                                textDecoration: transaction.excluded ? 'line-through' : 'none',
                                color: transaction.excluded ? 'text.secondary' : 'text.primary',
                              }}
                            >
                              {fCurrency(transaction.amount)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" onClick={handleClose}>
              Done
            </Button>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
}
