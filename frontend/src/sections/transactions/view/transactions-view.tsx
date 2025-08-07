import type { TransactionProps } from 'src/sections/transactions/transactions-table-row';
import type { FilterOptions } from 'src/sections/transactions/transactions-table-toolbar';
import type { NewTransactionSubmitProps } from 'src/sections/transactions/new-transaction-modal';
import type { ImportTransactionSubmit } from 'src/components/transactions-importer/transactions-importer';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { handleRequest } from 'src/utils/handle-request';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ExportModal } from 'src/components/export-modal/export-modal';
import { ImportTransactionsModal } from 'src/components/transactions-importer/transactions-importer';

import { TableNoData } from '../table-no-data';
import { TableEmptyRows } from '../table-empty-rows';
import { UserTableHead } from '../transactions-table-head';
import { NewTransactionModal } from '../new-transaction-modal';
import { TransactionsTableRow } from '../transactions-table-row';
import { UserTableToolbar } from '../transactions-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';

// ----------------------------------------------------------------------

export function TransactionsView() {
  const table = useTable();

  const [filterName, setFilterName] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchText: '',
    category: '',
    type: '',
    dateFrom: null,
    dateTo: null,
    amountMin: '',
    amountMax: '',
  });

  const [transactions, setTransactions] = useState<TransactionProps[]>([]);

  const dataFiltered: TransactionProps[] = applyFilter({
    inputData: transactions.map((a) => ({
      ...a,
      amount: a.type === 'withdrawal' ? -Math.abs(a.amount) : Math.abs(a.amount),
    })),
    comparator: getComparator(table.order, table.orderBy),
    filterName,
    filterOptions,
  });

  const notFound =
    !dataFiltered.length &&
    (!!filterName || Object.values(filterOptions).some((v) => v !== '' && v !== null));

  const [openNew, setOpenNew] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openExport, setOpenExport] = useState(false);

  const handleUpdateTransaction = useCallback(
    (id: string, updatedData: Partial<TransactionProps>) => {
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === id ? { ...transaction, ...updatedData } : transaction
        )
      );
    },
    []
  );

  const handleNewTransaction = async ({
    type,
    amount,
    description,
    category,
    date,
  }: NewTransactionSubmitProps) => {
    // Send the new transaction data to the backend
    const result = await handleRequest(
      '/api/transactions',
      'POST',
      undefined, // No error handler needed here
      true, // Use authentication
      {
        type,
        amount,
        description,
        category,
        date: date.toDate(),
      }
    );

    if (result) {
      setOpenNew(false);
      setTransactions((prev) => [...prev, result.data]);
    }
  };

  const handleImportTransactions = ({ data }: ImportTransactionSubmit) => {
    setOpenImport(false);
    setTransactions((prev) => [...prev, ...data]);
  };

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
      <ImportTransactionsModal
        open={openImport}
        onClose={() => setOpenImport(false)}
        onSubmit={handleImportTransactions}
        existingTransactions={transactions}
      />
      <ExportModal open={openExport} onClose={() => setOpenExport(false)} />
      <NewTransactionModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        onSubmit={handleNewTransaction}
      />
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Transactions
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="solar:export-bold" />}
          onClick={() => setOpenExport(true)}
          sx={{ mr: 1 }}
        >
          Export Transactions
        </Button>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="solar:import-bold" />}
          onClick={() => setOpenImport(true)}
          sx={{ mr: 1 }}
        >
          Import Transactions
        </Button>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setOpenNew(true)}
        >
          New Transaction
        </Button>
      </Box>

      <Card>
        <UserTableToolbar
          numSelected={table.selected.length}
          filterName={filterName}
          onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterName(event.target.value);
            table.onResetPage();
          }}
          onDeleteSelected={() => {
            handleRequest('/api/transactions', 'DELETE', undefined, true, {
              ids: table.selected,
            }).then((result) => {
              if (result) {
                setTransactions((prev) =>
                  prev.filter((transaction) => !table.selected.includes(transaction.id))
                );
                table.onResetPage();
                table.onSelectAllRows(false, []);
              }
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
                    label: `Amount${filterName !== '' ? ` ($${dataFiltered.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)})` : ''}`,
                  },
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
                    <TransactionsTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onDeleteRow={(id) => {
                        setTransactions((prev) =>
                          prev.filter((transaction) => transaction.id !== id)
                        );
                      }}
                      onUpdateRow={handleUpdateTransaction}
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
