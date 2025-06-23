/* eslint-disable react/jsx-no-useless-fragment */
import type { TransactionProps } from 'src/sections/transactions/transactions-table-row';
import type { NewTransactionSubmitProps } from 'src/sections/transactions/new-transaction-modal';

import dayjs from 'dayjs';
import { useState } from 'react';
import { useCSVReader, formatFileSize, lightenDarkenColor } from 'react-papaparse';

import {
  Box,
  Button,
  Dialog,
  Select,
  MenuItem,
  Typography,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { categories } from 'src/_mock/_categories';

import { CSVImporterStyles } from './styles';

export type ImportTransactionSubmit = {
  data: TransactionProps[];
};

type NewTransactionModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: ({ data }: ImportTransactionSubmit) => void;
};

const DEFAULT_REMOVE_HOVER_COLOR = '#A01919';
const REMOVE_HOVER_COLOR_LIGHT = lightenDarkenColor(DEFAULT_REMOVE_HOVER_COLOR, 40);

const styles = CSVImporterStyles;

export function ImportTransactionsModal({
  onClose,
  onSubmit,
  open = true,
}: NewTransactionModalProps) {
  const [error, setError] = useState<string | null>(null);

  const [headers, setHeaders] = useState<string[]>([]);
  const expectedHeaders = ['Date', 'Description', 'Amount', 'Type', 'Category'];
  const [headersMatch, setHeadersMatch] = useState<{ [key: string]: string }>({});
  const [categoriesMatch, setCategoriesMatch] = useState<{ [key: string]: string }>({});
  const [csvData, setCSVData] = useState<any[]>([]);
  const [stage, setStage] = useState(0);

  const handleHeadersMatchChange = (expected: string, found: string) => {
    setHeadersMatch((prev) => ({ ...prev, [expected]: found }));
  };

  const handleCategoriesMatchChange = (expected: string, found: string) => {
    setCategoriesMatch((prev) => ({ ...prev, [expected]: found }));
  };

  const handleSubmit = () => {
    // onSubmit({ amount: parseFloat(amount), type, description, category, date });
    onClose();
  };

  const { CSVReader } = useCSVReader();
  const [zoneHover, setZoneHover] = useState(false);
  const [removeHoverColor, setRemoveHoverColor] = useState(DEFAULT_REMOVE_HOVER_COLOR);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Transaction</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {error && (
          <Typography color="error" variant="body2" style={{ textAlign: 'center' }}>
            {error}
          </Typography>
        )}
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
          {({ getRootProps, acceptedFile, ProgressBar, getRemoveFileProps, Remove }: any) => (
            <>
              <div
                {...getRootProps()}
                style={Object.assign({}, styles.zone, zoneHover && styles.zoneHover)}
              >
                {acceptedFile ? (
                  <>
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
                  </>
                ) : (
                  'Drop CSV file here or click to upload'
                )}
              </div>
            </>
          )}
        </CSVReader>
        {stage == 1 && headers.length > 0 && (
          <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Match Expected Headers to Found Headers
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
                setStage(2);

                const categoryHeaderIndex = headersMatch['Category'];
                const categoryValues = csvData.map((row) => row[headers.indexOf(categoryHeaderIndex)]);
                const uniqueCategories = Array.from(new Set(categoryValues)).filter(
                  (cat) => cat && cat.trim() !== ''
                );
                const categoriesMap: { [key: string]: string } = {};
                uniqueCategories.forEach((category) => {
                  categoriesMap[category] = ""; // Default to no match
                  let foundCategory = categories.find((cat) =>
                    cat.label.toLowerCase() === category.toLowerCase());
                  if (!foundCategory)
                    foundCategory = categories.find((cat) => // has one word match
                      cat.label.toLowerCase().split(' ').some((word) =>
                        category.toLowerCase().includes(word)
                      )
                    );
                  if (foundCategory) {
                    categoriesMap[category] = foundCategory.label; // Match found
                  }
                });
                setCategoriesMatch(categoriesMap);
              }}
            >
              Continue
            </Button>
          </Box>
        )}
        {stage == 2 && (
          <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Redefine Categories
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
            <Button
              variant="contained"
              onClick={() => {
                if (
                  Object.values(categoriesMatch).some((value) => value === '')
                ) {
                  setError('Please match all categories to their our definitions.');
                  return;
                }
                setError(null);
                const dateIndex = headers.indexOf(headersMatch['Date']);
                const descriptionIndex = headers.indexOf(headersMatch['Description']);
                const amountIndex = headers.indexOf(headersMatch['Amount']);
                const typeIndex = headers.indexOf(headersMatch['Type']);
                const categoryIndex = headers.indexOf(headersMatch['Category']);

                let errorStr = '';

                const data: (NewTransactionSubmitProps | null)[] = csvData.map((row) => {
                  const type = row[typeIndex];
                  if (!row || row.length <= 1) return null;

                  if (headersMatch['Type'] !== 'calculate_1' && headersMatch['Type'] !== 'calculate_2' &&
                      type !== 'withdrawal' && type !== 'deposit') {
                    errorStr += `Invalid transaction type: ${type}\n`;
                    return null;
                  }
                  
                  if (isNaN(parseFloat(row[amountIndex]))) {
                    console.error('Invalid amount:', row[amountIndex]);
                    console.error('Row data:', row);
                    console.error(row.length);
                    errorStr += `Invalid amount: ${row[amountIndex]} ${row}\n`;
                    return null;
                  }

                  return {
                    userId: 1, // Replace with actual user ID
                    date: dayjs(row[dateIndex]),
                    description: row[descriptionIndex],
                    amount: Math.abs(parseFloat(row[amountIndex])),
                    type: (headersMatch['Type'] === 'calculate_1' ? (row[amountIndex] > 0 ? 'withdrawal' : 'deposit') : headersMatch['Type'] === 'calculate_2' ? (row[amountIndex] < 0 ? 'withdrawal' : 'deposit') : (row[typeIndex])),
                    category: categoriesMatch[row[categoryIndex]] || row[categoryIndex],
                  };
                }).filter((item) => item != null) as NewTransactionSubmitProps[];

                // console.log('Parsed data:', data);

                if (errorStr) {
                  setError(`Errors found in CSV data:\n${errorStr}\nPlease fix the errors and try again.`);
                  return;
                }

                fetch('/api/transactions/import', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ data }),
                })
                  .then((response) => response.json())
                  .then((res) => {
                    if (res.error) {
                      setError(`Error importing transactions: ${res.error}`);
                    } else {
                      onSubmit({ data: res.data });
                      onClose();
                    }
                  })
                  .catch((err) => {
                    setError(`Error importing transactions: ${err.message}`);
                    console.error('Error importing transactions:', err);
                  });
              }}
            >
              Import
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
