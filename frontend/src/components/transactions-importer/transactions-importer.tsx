/* eslint-disable react/jsx-no-useless-fragment */
import type { TransactionProps } from 'src/sections/transactions/transactions-table-row';
import type { NewTransactionSubmitProps } from 'src/sections/transactions/new-transaction-modal';

import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { useCSVReader, formatFileSize, lightenDarkenColor } from 'react-papaparse';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Tab,
  Box,
  Tabs,
  Chip,
  Grid,
  Alert,
  Paper,
  Table,
  Button,
  Dialog,
  Select,
  Tooltip,
  Checkbox,
  MenuItem,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  TextField,
  IconButton,
  Typography,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  TablePagination,
  CircularProgress,
} from '@mui/material';

import { handleRequest } from 'src/utils/handle-request';

import { categories, getCategoryFromPlaid } from 'src/_mock/_categories';

import { Iconify } from 'src/components/iconify';

import { CSVImporterStyles } from './styles';

export type ImportTransactionSubmit = {
  data: TransactionProps[];
};

export type ParsedTransaction = {
  id: string;
  date: dayjs.Dayjs;
  description: string;
  amount: number;
  type: 'withdrawal' | 'deposit';
  category: string;
  accountId?: string;
  accountName?: string;
  isDuplicate?: boolean;
  isSelected?: boolean;
};

type ImportTransactionsModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: ({ data }: ImportTransactionSubmit) => void;
  existingTransactions?: TransactionProps[];
};

const DEFAULT_REMOVE_HOVER_COLOR = '#A01919';
const REMOVE_HOVER_COLOR_LIGHT = lightenDarkenColor(DEFAULT_REMOVE_HOVER_COLOR, 40);

const styles = CSVImporterStyles;

export function ImportTransactionsModal({
  onClose,
  onSubmit,
  open = true,
  existingTransactions = [],
}: ImportTransactionsModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [importType, setImportType] = useState<'csv' | 'plaid'>('csv');
  const [stage, setStage] = useState(0); // 0: source selection, 1: data mapping, 2: editing, 3: preview

  // CSV specific state
  const [headers, setHeaders] = useState<string[]>([]);
  const expectedHeaders = ['Date', 'Description', 'Amount', 'Type', 'Category'];
  const [headersMatch, setHeadersMatch] = useState<{ [key: string]: string }>({});
  const [categoriesMatch, setCategoriesMatch] = useState<{ [key: string]: string }>({});
  const [csvData, setCSVData] = useState<any[]>([]);

  // Plaid specific state
  const [plaidAccounts, setPlaidAccounts] = useState<any[] | null>(null);
  const [selectedPlaidAccount, setSelectedPlaidAccount] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: dayjs().subtract(30, 'days'), end: dayjs() });

  // Common state for editing
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [isProcessing, setIsProcessing] = useState(false);

  const { CSVReader } = useCSVReader();
  const [zoneHover, setZoneHover] = useState(false);
  const [removeHoverColor, setRemoveHoverColor] = useState(DEFAULT_REMOVE_HOVER_COLOR);

  const handleCancel = () => {
    onClose();
    setError(null);
    setImportType('csv');
    setStage(0);
    setHeaders([]);
    setHeadersMatch({});
    setCategoriesMatch({});
    setCSVData([]);
    setPlaidAccounts(null);
    setSelectedPlaidAccount('');
    setDateRange({ start: dayjs().subtract(30, 'days'), end: dayjs() });
    setParsedTransactions([]);
    setSearchQuery('');
    setCurrentPage(0);
    setRowsPerPage(25);
    setIsProcessing(false);
  };

  const handleHeadersMatchChange = (expected: string, found: string) => {
    setHeadersMatch((prev) => ({ ...prev, [expected]: found }));
  };

  const handleCategoriesMatchChange = (expected: string, found: string) => {
    setCategoriesMatch((prev) => ({ ...prev, [expected]: found }));
  };

  const detectDuplicates = (transactions: ParsedTransaction[]) => {
    if (existingTransactions.length === 0) return transactions; // Skip if no existing transactions

    return transactions.map((transaction) => {
      // Fast duplicate check - only check recent transactions (last 30 days)
      const transactionDate = transaction.date;
      const recentTransactions = existingTransactions.filter(
        (existing) => Math.abs(dayjs(existing.date).diff(transactionDate, 'days')) <= 1
      );

      const isDuplicate = recentTransactions.some(
        (existing) =>
          Math.abs(existing.amount - transaction.amount) < 0.01 &&
          existing.description
            .toLowerCase()
            .includes(transaction.description.toLowerCase().substring(0, 8))
      );
      return { ...transaction, isDuplicate };
    });
  };

  const handleTransactionEdit = (id: string, field: keyof ParsedTransaction, value: any) => {
    setParsedTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleSelectTransaction = (id: string, selected: boolean) => {
    setParsedTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isSelected: selected } : t))
    );
  };

  const handleSelectAll = (selected: boolean) => {
    // Only select/deselect filtered transactions
    const filteredTransactions = getFilteredTransactions();
    setParsedTransactions((prev) =>
      prev.map((t) => {
        const isInFiltered = filteredTransactions.some((ft) => ft.id === t.id);
        return isInFiltered ? { ...t, isSelected: selected } : t;
      })
    );
  };

  const getFilteredTransactions = () => {
    if (!searchQuery.trim()) return parsedTransactions;

    return parsedTransactions.filter(
      (transaction) =>
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.amount.toString().includes(searchQuery) ||
        categories
          .find((cat) => cat.id === transaction.category)
          ?.label.toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
  };

  // Helper to check if all filtered transactions are selected
  const getSelectAllState = () => {
    const filtered = getFilteredTransactions();
    if (filtered.length === 0) return false;
    return filtered.every((t) => t.isSelected);
  };

  const bulkEditCategory = (category: string) => {
    setParsedTransactions((prev) => prev.map((t) => (t.isSelected ? { ...t, category } : t)));
  };

  const bulkEditType = (type: 'withdrawal' | 'deposit') => {
    setParsedTransactions((prev) => prev.map((t) => (t.isSelected ? { ...t, type } : t)));
  };

  // Fetch Plaid accounts when modal opens and Plaid tab is selected
  useEffect(() => {
    if (open && importType === 'plaid') {
      const fetchPlaidAccounts = async () => {
        try {
          const response = await handleRequest('/api/plaid/balance', 'GET', setError, true);
          if (response?.success) {
            setPlaidAccounts(
              response.data.map((account: any) => ({
                id: account.account_id,
                name: account.name,
                type: account.subtype || 'other',
                balance: account.balances.current || 0,
              }))
            );
          }
        } catch (err) {
          console.error('Error fetching Plaid accounts:', err);
          setError('Failed to fetch connected accounts');
        }
      };

      fetchPlaidAccounts();
    }
  }, [open, importType]);

  const fetchPlaidTransactions = async () => {
    if (!selectedPlaidAccount) return;

    try {
      const response = await handleRequest(
        `/api/plaid/transactions?account_id=${selectedPlaidAccount}&start_date=${dateRange.start.format('YYYY-MM-DD')}&end_date=${dateRange.end.format('YYYY-MM-DD')}`,
        'GET',
        setError,
        true
      );

      if (response?.success) {
        // console.log(response.data.map((a: any) => a.personal_finance_category.detailed));
        const transactions: ParsedTransaction[] = response.data.map(
          (transaction: any, index: number) => ({
            id: `plaid-${transaction.transaction_id}`,
            date: dayjs(transaction.date),
            description: transaction.name,
            amount: Math.abs(transaction.amount),
            type: transaction.amount > 0 ? 'withdrawal' : ('deposit' as 'withdrawal' | 'deposit'),
            category: getCategoryFromPlaid(transaction?.personal_finance_category?.detailed),
            accountId: selectedPlaidAccount,
            accountName: plaidAccounts!.find((a) => a.id === selectedPlaidAccount)?.name,
            isSelected: true,
          })
        );

        const transactionsWithDuplicates = detectDuplicates(transactions);
        setParsedTransactions(transactionsWithDuplicates);
        setStage(3);
      }
    } catch (err) {
      console.error('Error fetching Plaid transactions:', err);
      setError('Failed to fetch transactions from connected account');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Import Transactions</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stage 0: Source Selection */}
        {stage === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Choose Import Source
            </Typography>

            <Tabs value={importType} onChange={(_, value) => setImportType(value)}>
              <Tab value="csv" label="Upload CSV File" />
              <Tab value="plaid" label="Import from Connected Account" />
            </Tabs>

            {importType === 'csv' && (
              <Box sx={{ mt: 2 }}>
                <CSVReader
                  onUploadAccepted={(results: any) => {
                    if (results.errors.length > 0) {
                      setError(`Error parsing CSV file: ${results.errors[0].message}`);
                      return;
                    }

                    setError(null);
                    if (results.data.length < 2) {
                      setError('CSV file must contain at least one row of data.');
                      return;
                    }
                    setZoneHover(false);

                    const headerRow = results.data[0];
                    setCSVData(results.data.slice(1));
                    setHeaders(headerRow);
                    setStage(1);

                    // Auto-match headers
                    for (let i = 0; i < headerRow.length; i++) {
                      const header = headerRow[i];
                      if (expectedHeaders.includes(header)) {
                        setHeadersMatch((prev) => ({ ...prev, [header]: header }));
                      }
                    }
                  }}
                  onDragOver={(event: DragEvent) => {
                    event.preventDefault();
                    setZoneHover(true);
                  }}
                  onDragLeave={(event: DragEvent) => {
                    event.preventDefault();
                    setZoneHover(false);
                  }}
                >
                  {({
                    getRootProps,
                    acceptedFile,
                    ProgressBar,
                    getRemoveFileProps,
                    Remove,
                  }: any) => (
                    <div
                      {...getRootProps()}
                      style={Object.assign({}, styles.zone, zoneHover && styles.zoneHover)}
                    >
                      {acceptedFile ? (
                        <div style={styles.file}>
                          <div style={styles.info}>
                            <span style={styles.size}>{formatFileSize(acceptedFile.size)}</span>
                            <span style={styles.name}>{acceptedFile.name}</span>
                          </div>
                          <div style={styles.progressBar}>
                            <ProgressBar />
                          </div>
                          <div
                            {...getRemoveFileProps()}
                            style={styles.remove}
                            onMouseOver={(event: Event) => {
                              event.preventDefault();
                              setRemoveHoverColor(REMOVE_HOVER_COLOR_LIGHT);
                            }}
                            onMouseOut={(event: Event) => {
                              event.preventDefault();
                              setRemoveHoverColor(DEFAULT_REMOVE_HOVER_COLOR);
                            }}
                          >
                            <Remove color={removeHoverColor} />
                          </div>
                        </div>
                      ) : (
                        'Drop CSV file here or click to upload'
                      )}
                    </div>
                  )}
                </CSVReader>
              </Box>
            )}

            {importType === 'plaid' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select a connected account to import transactions from:
                </Typography>
                {plaidAccounts != null && plaidAccounts.length === 0 ? (
                  <Alert severity="info">
                    No connected accounts found. Please link an account first from the Accounts
                    page.
                  </Alert>
                ) : (
                  <FormControl fullWidth>
                    <InputLabel>Select Account</InputLabel>
                    <Select
                      value={selectedPlaidAccount}
                      label="Select Account"
                      onChange={(e) => setSelectedPlaidAccount(e.target.value)}
                    >
                      {plaidAccounts != null &&
                        plaidAccounts.map((account) => (
                          <MenuItem key={account.id} value={account.id}>
                            {account.name} - {account.type}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                )}

                {plaidAccounts != null && plaidAccounts.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Date Range:
                    </Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <DatePicker
                            label="Start Date"
                            value={dateRange.start}
                            onChange={(newValue) =>
                              setDateRange((prev) => ({ ...prev, start: newValue || dayjs() }))
                            }
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <DatePicker
                            label="End Date"
                            value={dateRange.end}
                            onChange={(newValue) =>
                              setDateRange((prev) => ({ ...prev, end: newValue || dayjs() }))
                            }
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                          />
                        </Grid>
                      </Grid>
                    </LocalizationProvider>
                  </Box>
                )}

                {selectedPlaidAccount && (
                  <Button variant="contained" sx={{ mt: 2 }} onClick={fetchPlaidTransactions}>
                    Fetch Transactions
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Stage 1: CSV Header Mapping */}
        {stage === 1 && headers.length > 0 && (
          <Box sx={{ maxWidth: 500, mx: 'auto', mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Map CSV Headers
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Match your CSV columns to the expected fields:
            </Typography>

            {expectedHeaders.map((expected) => (
              <FormControl key={expected} fullWidth margin="normal" size="small">
                <InputLabel id={`select-label-${expected}`}>{expected}</InputLabel>
                <Select
                  labelId={`select-label-${expected}`}
                  value={headersMatch[expected] || ''}
                  label={expected}
                  onChange={(e) => handleHeadersMatchChange(expected, e.target.value)}
                >
                  {expected == 'Type' && (
                    <MenuItem key="calculate_1" value="calculate_1">
                      <em>Amount &gt; 0 = Withdrawl, Amount &lt; 0 = Deposit</em>
                    </MenuItem>
                  )}
                  {expected == 'Type' && (
                    <MenuItem key="calculate_2" value="calculate_2">
                      <em>Amount &lt; 0 = Withdrawl, Amount &gt; 0 = Deposit</em>
                    </MenuItem>
                  )}
                  {headers.map((found) => (
                    <MenuItem key={found} value={found}>
                      {found}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}

            <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
              <Button variant="outlined" onClick={() => setStage(0)}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  if (
                    Object.values(headersMatch).some((value) => value === '') ||
                    Object.keys(headersMatch).length !== expectedHeaders.length
                  ) {
                    setError('Please match all expected headers to found headers.');
                    return;
                  }
                  setError(null);

                  // Auto-match categories first
                  const categoryHeaderIndex = headersMatch['Category'];
                  const categoryValues = csvData.map(
                    (row) => row[headers.indexOf(categoryHeaderIndex)]
                  );
                  const uniqueCategories = Array.from(new Set(categoryValues)).filter(
                    (cat) => cat && cat.trim() !== ''
                  );
                  const categoriesMap: { [key: string]: string } = {};
                  uniqueCategories.forEach((category) => {
                    categoriesMap[category] = ''; // Default to no match
                    let foundCategory = categories.find(
                      (cat) => cat.label.toLowerCase() === category.toLowerCase()
                    );
                    if (!foundCategory)
                      foundCategory = categories.find(
                        (
                          cat // has one word match
                        ) =>
                          cat.label
                            .toLowerCase()
                            .split(' ')
                            .some((word) => category.toLowerCase().includes(word))
                      );
                    if (foundCategory) {
                      categoriesMap[category] = foundCategory.label; // Match found
                    }
                  });
                  setCategoriesMatch(categoriesMap);
                  setStage(2);
                }}
              >
                Continue
              </Button>
            </Box>
          </Box>
        )}

        {/* Stage 2: Category Mapping */}
        {stage === 2 && Object.keys(categoriesMatch).length > 0 && (
          <Box sx={{ maxWidth: 500, mx: 'auto', mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Map Categories
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Match the categories found in your CSV to our predefined categories:
            </Typography>

            {Object.keys(categoriesMatch).map((category) => (
              <FormControl key={category} fullWidth margin="normal" size="small">
                <InputLabel id={`select-category-${category}`}>{category}</InputLabel>
                <Select
                  labelId={`select-category-${category}`}
                  value={categoriesMatch[category] || ''}
                  label={category}
                  onChange={(e) => handleCategoriesMatchChange(category, e.target.value)}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.label}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}

            <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
              <Button variant="outlined" onClick={() => setStage(1)}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={async () => {
                  if (Object.values(categoriesMatch).some((value) => value === '')) {
                    setError('Please match all categories to their definitions.');
                    return;
                  }
                  setError(null);
                  setIsProcessing(true);

                  // Use setTimeout to allow UI to update with loading state
                  setTimeout(() => {
                    try {
                      // Parse CSV data into transactions
                      const dateIndex = headers.indexOf(headersMatch['Date']);
                      const descriptionIndex = headers.indexOf(headersMatch['Description']);
                      const amountIndex = headers.indexOf(headersMatch['Amount']);
                      const typeIndex =
                        headersMatch['Type'] === 'calculate_1' ||
                        headersMatch['Type'] === 'calculate_2'
                          ? -1
                          : headers.indexOf(headersMatch['Type']);
                      const categoryIndex = headers.indexOf(headersMatch['Category']);

                      const transactions: ParsedTransaction[] = csvData
                        .filter((row) => row && row.length > 1)
                        .map((row, index) => {
                          const rawAmount = parseFloat(row[amountIndex]);
                          const amount = Math.abs(rawAmount);
                          let type: 'withdrawal' | 'deposit' = 'withdrawal';

                          if (headersMatch['Type'] === 'calculate_1') {
                            // Amount > 0 = Withdrawal, Amount < 0 = Deposit
                            type = rawAmount > 0 ? 'withdrawal' : 'deposit';
                          } else if (headersMatch['Type'] === 'calculate_2') {
                            // Amount < 0 = Withdrawal, Amount > 0 = Deposit
                            type = rawAmount < 0 ? 'withdrawal' : 'deposit';
                          } else if (typeIndex >= 0) {
                            // Use the actual type column
                            const typeValue = row[typeIndex]?.toLowerCase();
                            type =
                              typeValue === 'deposit' || typeValue === 'credit'
                                ? 'deposit'
                                : 'withdrawal';
                          }

                          // Map category using the category mapping
                          const rawCategory = row[categoryIndex] || 'miscellaneous';
                          const mappedCategory = categoriesMatch[rawCategory] || rawCategory;
                          const category = categories.find(
                            (cat) => cat.label.toLowerCase() === mappedCategory.toLowerCase()
                          );

                          return {
                            id: `csv-${index}`,
                            date: dayjs(row[dateIndex]),
                            description: row[descriptionIndex],
                            amount,
                            type,
                            category: category?.id || 'miscellaneous',
                            isSelected: true,
                          };
                        });

                      // Only run duplicate detection on small batches or make it optional
                      const transactionsWithDuplicates =
                        transactions.length < 100 ? detectDuplicates(transactions) : transactions; // Skip duplicate detection for large datasets

                      setParsedTransactions(transactionsWithDuplicates);
                      setIsProcessing(false);
                      setStage(3);
                    } catch {
                      setError('Error processing transactions. Please check your data.');
                      setIsProcessing(false);
                    }
                  }, 100);
                }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Processing...
                  </>
                ) : (
                  'Continue to Edit'
                )}
              </Button>
            </Box>
          </Box>
        )}

        {/* Stage 3: Transaction Editing */}
        {stage === 3 && parsedTransactions.length > 0 && (
          <Box>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6">
                Review & Edit Transactions ({parsedTransactions.filter((t) => t.isSelected).length}{' '}
                selected of {getFilteredTransactions().length} shown, {parsedTransactions.length}{' '}
                total)
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2">Bulk Edit Selected:</Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    label="Category"
                    onChange={(e) => bulkEditCategory(e.target.value)}
                    value=""
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    label="Type"
                    onChange={(e) => bulkEditType(e.target.value as 'withdrawal' | 'deposit')}
                    value=""
                  >
                    <MenuItem value="withdrawal">Withdrawal</MenuItem>
                    <MenuItem value="deposit">Deposit</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search transactions by description, amount, or category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(0); // Reset to first page when searching
                }}
                sx={{ width: 400 }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                      <Iconify icon="eva:search-fill" />
                    </Box>
                  ),
                }}
              />
            </Box>

            {parsedTransactions.some((t) => t.isDuplicate) && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Some transactions appear to be duplicates based on date, amount, and description
                similarity. Review carefully before importing.
              </Alert>
            )}

            <TableContainer component={Paper}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={getSelectAllState()}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getFilteredTransactions()
                    .slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage)
                    .map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        sx={{
                          bgcolor: transaction.isDuplicate ? 'warning.light' : 'inherit',
                          opacity: transaction.isSelected ? 1 : 0.6,
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={transaction.isSelected || false}
                            onChange={(e) =>
                              handleSelectTransaction(transaction.id, e.target.checked)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            size="small"
                            value={transaction.date.format('YYYY-MM-DD')}
                            onChange={(e) =>
                              handleTransactionEdit(transaction.id, 'date', dayjs(e.target.value))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={transaction.description}
                            onChange={(e) =>
                              handleTransactionEdit(transaction.id, 'description', e.target.value)
                            }
                            sx={{ minWidth: 200 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={transaction.amount}
                            onChange={(e) =>
                              handleTransactionEdit(
                                transaction.id,
                                'amount',
                                parseFloat(e.target.value)
                              )
                            }
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            size="small"
                            value={transaction.type}
                            onChange={(e) =>
                              handleTransactionEdit(transaction.id, 'type', e.target.value)
                            }
                          >
                            <MenuItem value="withdrawal">Withdrawal</MenuItem>
                            <MenuItem value="deposit">Deposit</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            size="small"
                            value={transaction.category}
                            onChange={(e) =>
                              handleTransactionEdit(transaction.id, 'category', e.target.value)
                            }
                            sx={{ minWidth: 150 }}
                          >
                            {categories.map((cat) => (
                              <MenuItem key={cat.id} value={cat.id}>
                                {cat.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          {transaction.isDuplicate && (
                            <Tooltip title="Potential duplicate transaction">
                              <Chip
                                label="Duplicate?"
                                color="warning"
                                size="small"
                                icon={<Iconify icon="mingcute:edit-line" />}
                              />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setParsedTransactions((prev) =>
                                prev.filter((t) => t.id !== transaction.id)
                              );
                            }}
                            color="error"
                          >
                            <Iconify icon="solar:trash-bin-trash-outline" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[25, 50, 100]}
                component="div"
                count={getFilteredTransactions().length}
                rowsPerPage={rowsPerPage}
                page={currentPage}
                onPageChange={(_, newPage) => setCurrentPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setCurrentPage(0);
                }}
              />
            </TableContainer>

            <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={() => setStage(importType === 'csv' ? 2 : 0)}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={async () => {
                  if (parsedTransactions.length === 0) {
                    setError('No transactions to import.');
                    return;
                  }

                  const data: NewTransactionSubmitProps[] = parsedTransactions.map((t) => ({
                    userId: 1,
                    date: t.date,
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                    category: t.category,
                  }));

                  try {
                    const result = await handleRequest(
                      '/api/transactions/import',
                      'POST',
                      setError,
                      true,
                      { data }
                    );

                    if (result) {
                      onSubmit({ data: result.data });
                      onClose();
                    }
                  } catch {
                    setError('Failed to import transactions. Please try again.');
                  }
                }}
              >
                Import All {parsedTransactions.length} Transactions
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
