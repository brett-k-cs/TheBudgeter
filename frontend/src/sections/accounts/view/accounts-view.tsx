import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { handleRequest } from 'src/utils/handle-request';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { AccountItem } from '../account-item';
import { NewAccountModal } from '../new-account-modal';

import type { AccountProps } from '../account-item';
import type { NewAccountSubmitProps } from '../new-account-modal';

// ----------------------------------------------------------------------

export function AccountsView() {
  const [accounts, setAccounts] = useState<AccountProps[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await handleRequest('/api/accounts', 'GET', setError, true);
      if (response?.success) {
        setAccounts(
          response.data.map(
            (account: any) =>
              ({
                id: account.id.toString(),
                name: account.name,
                type: account.type,
                balance: parseFloat(account.balance.toString()),
                description: account.description,
                isActive: account.isActive,
                createdAt: new Date(account.createdAt),
              }) as AccountProps
          )
        );
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Failed to fetch accounts');
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleNewAccount = useCallback(
    async (accountData: NewAccountSubmitProps) => {
      try {
        const response = await handleRequest('/api/accounts', 'POST', setError, true, {
          name: accountData.name,
          type: accountData.type,
          balance: accountData.balance,
          description: accountData.description,
        });

        if (response?.success) {
          setOpenNew(false);
          await fetchAccounts(); // Refresh the list
        }
      } catch (err) {
        console.error('Error creating account:', err);
        setError('Failed to create account');
      }
    },
    [fetchAccounts]
  );

  const handleDeleteAccount = useCallback(
    async (accountId: string) => {
      try {
        const response = await handleRequest(
          `/api/accounts/${accountId}`,
          'DELETE',
          setError,
          true
        );

        if (response?.success) {
          await fetchAccounts(); // Refresh the list
        }
      } catch (err) {
        console.error('Error deleting account:', err);
        setError('Failed to delete account');
      }
    },
    [fetchAccounts]
  );

  const handleUpdateAccount = useCallback(
    async (accountId: string, accountData: Partial<AccountProps>) => {
      try {
        const response = await handleRequest(`/api/accounts/${accountId}`, 'PUT', setError, true, {
          name: accountData.name,
          type: accountData.type,
          balance: accountData.balance,
          description: accountData.description,
        });

        if (response?.success) {
          await fetchAccounts(); // Refresh the list
        }
      } catch (err) {
        console.error('Error updating account:', err);
        setError('Failed to update account');
      }
    },
    [fetchAccounts]
  );

  return (
    <DashboardContent>
      <NewAccountModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        onSubmit={handleNewAccount}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Bank Accounts
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setOpenNew(true)}
        >
          New Account
        </Button>
      </Box>

      <Grid container spacing={3}>
        {accounts.map((account) => (
          <Grid key={account.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <AccountItem
              account={account}
              onDelete={handleDeleteAccount}
              onUpdate={handleUpdateAccount}
            />
          </Grid>
        ))}
      </Grid>

      {accounts.length === 0 && !error && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            No accounts found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first bank account to start tracking your finances
          </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setOpenNew(true)}
          >
            Add Account
          </Button>
        </Box>
      )}
    </DashboardContent>
  );
}
