import type { ImportTransactionSubmit } from 'src/components/csv-importer/csv-importer';
import type { TransactionProps } from 'src/sections/transactions/transactions-table-row';
import type { NewTransactionSubmitProps } from 'src/sections/transactions/new-transaction-modal';

import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ImportTransactionsModal } from 'src/components/csv-importer/csv-importer';

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

  const [transactions, setTransactions] = useState<TransactionProps[]>([]);

  const dataFiltered: TransactionProps[] = applyFilter({
    inputData: transactions,
    comparator: getComparator(table.order, table.orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  const [openNew, setOpenNew] = useState(false);
  const [openImport, setOpenImport] = useState(false);

  const handleNewTransaction = ({
    type,
    amount,
    description,
    category,
    date,
  }: NewTransactionSubmitProps) => {
    // Send the new transaction data to the backend
    fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 1, // Replace with actual user ID
        type,
        amount,
        description,
        category,
        date: date.toDate(),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Transaction created:', data);
        setOpenNew(false);
        setTransactions((prev) => [
          ...prev,
          data.data
        ]);
      })
      .catch((error) => {
        console.error('Error creating transaction:', error);
      });
  };

  const handleImportTransactions = ({ data } : ImportTransactionSubmit) => {
    setOpenImport(false);
    setTransactions((prev) => [
      ...prev,
      ...data
    ]);
  }

  // On initial load, fetch transactions from the backend
  useEffect(() => {
    console.log('Fetching transactions from the backend...');
    fetch('/api/transactions')
      .then((response) => response.json())
      .then((data) => {
        console.log('Transactions fetched:', data);
        setTransactions(data);
      })
      .catch((error) => {
        console.error('Error fetching transactions:', error);
      });
  }, []);

  return (
    <DashboardContent>
      <ImportTransactionsModal
        open={openImport}
        onClose={() => setOpenImport(false)}
        onSubmit={handleImportTransactions}
      />
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
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <UserTableHead
                order={table.order}
                orderBy={table.orderBy}
                rowCount={transactions.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    transactions.map((transaction) => transaction.id)
                  )
                }
                headLabel={[
                  { id: 'date', label: 'Date' },
                  { id: 'description', label: 'Description' },
                  { id: 'category', label: 'Category' },
                  { id: 'amount', label: 'Amount' },
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
                    />
                  ))}

                <TableEmptyRows
                  height={68}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, transactions.length)}
                />

                {notFound && <TableNoData searchQuery={filterName} />}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          component="div"
          page={table.page}
          count={transactions.length}
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
