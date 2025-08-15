import type { TaxEstimate, TaxedTransaction } from 'src/utils/tax-calculations';
import type { TransactionProps } from 'src/sections/transactions/transactions-table-row';
import type { FilterOptions } from 'src/sections/transactions/transactions-table-toolbar';

import dayjs from 'dayjs';
import { useState, useEffect, useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { handleRequest } from 'src/utils/handle-request';
import { formatCurrency, calculateTaxEstimate } from 'src/utils/tax-calculations';
import { loadTaxCategories, updateTaxCategory, clearAllTaxCategories } from 'src/utils/tax-storage';

import { DashboardContent } from 'src/layouts/dashboard';

import { Scrollbar } from 'src/components/scrollbar';

import { TaxTableRow } from './tax-table-row';
import { TaxEstimateCard } from './tax-estimate-card';
import { TableNoData } from '../transactions/table-no-data';
import { TaxManagementToolbar } from './tax-management-toolbar';
import { TableEmptyRows } from '../transactions/table-empty-rows';
import { UserTableHead } from '../transactions/transactions-table-head';
import { UserTableToolbar } from '../transactions/transactions-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../transactions/utils';

// ----------------------------------------------------------------------

export function TaxEstimationView() {
  const table = useTable();

  const [filterName, setFilterName] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchText: '',
    category: 'income',
    type: 'deposit',
    dateFrom: dayjs().set('date', 1).set('month', 0).set('second', 0),
    dateTo: null,
    amountMin: '',
    amountMax: '',
  });

  const [transactions, setTransactions] = useState<TransactionProps[]>([]);
  const [taxCategories, setTaxCategories] = useState(loadTaxCategories());
  const [taxEstimate, setTaxEstimate] = useState<TaxEstimate | null>(null);

  // Combine transactions with tax categories (memoized to prevent infinite loops)
  const taxedTransactions: TaxedTransaction[] = useMemo(
    () =>
      transactions.map((transaction) => ({
        ...transaction,
        taxCategory: taxCategories[transaction.id] || 'none',
      })),
    [transactions, taxCategories]
  );

  const dataFiltered: any[] = applyFilter({
    inputData: taxedTransactions.map((a) => ({
      ...a,
      amount: a.type === 'withdrawal' ? -Math.abs(a.amount) : Math.abs(a.amount),
    })) as TaxedTransaction[],
    comparator: getComparator(table.order, table.orderBy),
    filterName,
    filterOptions,
  });

  const notFound =
    !dataFiltered.length &&
    (!!filterName || Object.values(filterOptions).some((v) => v !== '' && v !== null));

  // Update tax category for a transaction
  const handleTaxCategoryChange = useCallback(
    (transactionId: string, category: 'w2' | '1099' | 'none' | undefined) => {
      updateTaxCategory(transactionId, category);
      const updatedCategories = loadTaxCategories();
      setTaxCategories(updatedCategories);
    },
    []
  );

  // Handle bulk tax category change for selected transactions
  const handleBulkTaxCategoryChange = useCallback(
    (category: 'w2' | '1099' | 'none') => {
      // Only update income transactions (deposits) in the selected list
      const selectedIncomeTransactions = table.selected.filter((id) => {
        const transaction = dataFiltered.find((t) => t.id === id);
        return transaction && transaction.type === 'deposit';
      });

      selectedIncomeTransactions.forEach((transactionId) => {
        updateTaxCategory(transactionId, category);
      });

      const updatedCategories = loadTaxCategories();
      setTaxCategories(updatedCategories);

      // Clear selection after bulk update
      table.onSelectAllRows(false, []);
    },
    [table, dataFiltered]
  );

  // Calculate tax estimate whenever tax categories change
  useEffect(() => {
    console.log('Calculating tax estimate based on current transactions and tax categories...');
    const estimate = calculateTaxEstimate(taxedTransactions);
    setTaxEstimate(estimate);
  }, [taxedTransactions]);

  // On initial load, fetch transactions from the backend
  useEffect(() => {
    console.log('Fetching transactions from the backend...');
    handleRequest(
      '/api/transactions',
      'GET',
      undefined, // No error handler needed here
      true // Use authentication
    ).then((result) => {
      if (result) {
        setTransactions(result.data);
      }
    });
  }, []);

  return (
    <DashboardContent>
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Tax Estimation
        </Typography>
      </Box>

      {/* Tax Estimate Summary */}
      {taxEstimate && (
        <Box sx={{ mb: 3 }}>
          <TaxEstimateCard estimate={taxEstimate} />
        </Box>
      )}

      {/* Tax Management Toolbar */}
      <TaxManagementToolbar
        selectedCount={table.selected.length}
        onBulkTaxCategoryChange={handleBulkTaxCategoryChange}
        onClearAll={() => {
          clearAllTaxCategories();
          setTaxCategories({});
        }}
        onForceRefresh={() => {
          const updatedCategories = loadTaxCategories();
          setTaxCategories(updatedCategories);
        }}
      />

      <Card>
        <UserTableToolbar
          numSelected={table.selected.length}
          filterName={filterName}
          onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterName(event.target.value);
            table.onResetPage();
          }}
          onDeleteSelected={() => {
             const selectedIncomeTransactions = table.selected.filter((id) => {
              const transaction = dataFiltered.find((t) => t.id === id);
              return transaction && transaction.type === 'deposit';
            });

            selectedIncomeTransactions.forEach((transactionId) => {
              updateTaxCategory(transactionId, 'none');
            });

            setTaxCategories((prev) => {
              const updated = { ...prev };
              table.selected.forEach((id) => {
                delete updated[id];
              });
              return updated;
            });
          }}
          filterOptions={filterOptions}
          onFilterOptionsChange={setFilterOptions}
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <UserTableHead
                order={table.order}
                orderBy={table.orderBy}
                rowCount={dataFiltered.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    dataFiltered.map((transaction) => transaction.id)
                  )
                }
                headLabel={[
                  { id: 'date', label: 'Date' },
                  { id: 'description', label: 'Description' },
                  { id: 'category', label: 'Category' },
                  {
                    id: 'amount',
                    label: `Amount${filterName !== '' ? ` (${formatCurrency(dataFiltered.reduce((acc, curr) => acc + curr.amount, 0))})` : ''}`,
                  },
                  { id: 'taxCategory', label: 'Tax Category' },
                  { id: '' },
                ]}
              />
              <TableBody>
                {dataFiltered
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <TaxTableRow
                      key={row.id}
                      row={row}
                      maxDescriptionWidth={45}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onTaxCategoryChange={handleTaxCategoryChange}
                    />
                  ))}

                <TableEmptyRows
                  height={68}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />

                {notFound && <TableNoData searchQuery={filterName} />}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          component="div"
          page={table.page}
          count={dataFiltered.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[10, 25, 50]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

export function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('date');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const onSort = useCallback(
    (id: string) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
  );

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: string[]) => {
    if (checked) {
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  }, []);

  const onSelectRow = useCallback(
    (inputValue: string) => {
      const newSelected = selected.includes(inputValue)
        ? selected.filter((value) => value !== inputValue)
        : [...selected, inputValue];

      setSelected(newSelected);
    },
    [selected]
  );

  const onResetPage = useCallback(() => {
    setPage(0);
  }, []);

  const onChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const onChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      onResetPage();
    },
    [onResetPage]
  );

  return {
    page,
    order,
    onSort,
    orderBy,
    selected,
    rowsPerPage,
    onSelectRow,
    onResetPage,
    onChangePage,
    onSelectAllRows,
    onChangeRowsPerPage,
  };
}
