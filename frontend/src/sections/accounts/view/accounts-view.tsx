import type { PlaidLinkOnSuccess } from 'react-plaid-link';

import { usePlaidLink } from 'react-plaid-link';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { handleRequest } from 'src/utils/handle-request';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { AssetItem } from '../asset-item';
import { AccountItem } from '../account-item';
import { NewAssetModal } from '../new-asset-modal';
import { NewAccountModal } from '../new-account-modal';

import type { AssetProps } from '../asset-item';
import type { AccountProps } from '../account-item';
import type { NewAssetSubmitProps } from '../new-asset-modal';
import type { NewAccountSubmitProps } from '../new-account-modal';

// ----------------------------------------------------------------------

export function AccountsView() {
  const [accounts, setAccounts] = useState<AccountProps[] | null>(null);
  const [assets, setAssets] = useState<AssetProps[] | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [openNewAsset, setOpenNewAsset] = useState(false);
  const [error, setError] = useState<string>('');
  const [linkToken, setLinkToken] = useState<string | null>(null);

  // Create link token function
  const createLinkToken = useCallback(async () => {
    try {
      const linkTokenRes = await handleRequest(
        '/api/plaid/create_link_token',
        'POST',
        setError,
        true
      );
      if (linkTokenRes?.success) {
        setLinkToken(linkTokenRes.data.link_token);
      }
    } catch (err) {
      console.error('Error creating link token:', err);
      setError('Failed to create link token');
    }
  }, []);

  // Initialize link token on mount
  useEffect(() => {
    createLinkToken();
  }, [createLinkToken]);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await handleRequest('/api/accounts', 'GET', setError, true);
      if (response?.success) {
        if (response.data.length === 0) {
          setAccounts(null);
        } else {
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
                  isPlaid: false,
                }) as AccountProps
            )
          );
        }
      }

      const plaidResponse = await handleRequest('/api/plaid/balance', 'GET', setError, true);
      if (plaidResponse?.success) {
        console.log('Plaid balance fetched successfully:', plaidResponse.data);

        const plaidAccounts = plaidResponse.data.map((account: any) => ({
          id: account.account_id,
          name: account.name,
          type: account.subtype || 'other',
          balance: account.balances.current || 0,
          description: account.official_name || '',
          isActive: true,
          createdAt: new Date(), // Plaid accounts don't have a createdAt, so use current date
          isPlaid: true,
        })) as AccountProps[];

        setAccounts((prev) => {
          if (prev == null) return plaidAccounts;
          return [
            ...prev.filter((a) => !plaidAccounts.map((b) => b.id).includes(a.id)),
            ...plaidAccounts,
          ];
        });
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Failed to fetch accounts');
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const fetchAssets = useCallback(async () => {
    try {
      const response = await handleRequest('/api/assets', 'GET', setError, true);
      console.log('Assets fetched successfully:', response);
      if (response?.success) {
        setAssets(
          response.data.map(
            (asset: any) =>
              ({
                id: asset.id.toString(),
                name: asset.name,
                type: asset.type,
                valuation: parseFloat(asset.valuation.toString()),
                ownershipPercentage: asset.ownershipPercentage ?? 100,
                description: asset.description,
                createdAt: new Date(asset.createdAt),
                updatedAt: new Date(asset.updatedAt),
              }) as AssetProps
          )
        );
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('Failed to fetch assets');
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (publicToken, metadata) => {
      console.log(publicToken, metadata);

      const response = await handleRequest(
        '/api/plaid/exchange_public_token',
        'POST',
        setError,
        true,
        {
          public_token: publicToken,
        }
      );

      if (response?.success) {
        console.log('Public token exchanged successfully:', response.data);
        await fetchAccounts(); // Refresh accounts after linking
      }
    },
    [fetchAccounts]
  );

  // Plaid Link configuration - only initialize when token is available
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: (errorP, metadata) => {
      if (errorP) {
        console.error('Plaid Link exited with error:', errorP);
        setError('Failed to link account');
      } else {
        console.log('Plaid Link exited successfully:', metadata);
      }
    },
  });

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

  const handleNewAsset = useCallback(
    async (assetData: NewAssetSubmitProps) => {
      try {
        const response = await handleRequest('/api/assets', 'POST', setError, true, {
          name: assetData.name,
          type: assetData.type,
          valuation: assetData.valuation,
          description: assetData.description,
          ownershipPercentage: assetData.ownershipPercentage,
        });

        if (response?.success) {
          setOpenNewAsset(false);
          await fetchAssets(); // Refresh the list
        }
      } catch (err) {
        console.error('Error creating asset:', err);
        setError('Failed to create asset');
      }
    },
    [fetchAssets]
  );

  const handleDeleteAsset = useCallback(
    async (assetId: string) => {
      try {
        const response = await handleRequest(`/api/assets/${assetId}`, 'DELETE', setError, true);

        if (response?.success) {
          await fetchAssets(); // Refresh the list
        }
      } catch (err) {
        console.error('Error deleting asset:', err);
        setError('Failed to delete asset');
      }
    },
    [fetchAssets]
  );

  const handleUpdateAsset = useCallback(
    async (assetId: string, assetData: Partial<AssetProps>) => {
      try {
        const response = await handleRequest(`/api/assets/${assetId}`, 'PUT', setError, true, {
          name: assetData.name,
          type: assetData.type,
          valuation: assetData.valuation,
          description: assetData.description,
          ownershipPercentage: assetData.ownershipPercentage,
        });

        if (response?.success) {
          await fetchAssets(); // Refresh the list
        }
      } catch (err) {
        console.error('Error updating asset:', err);
        setError('Failed to update asset');
      }
    },
    [fetchAssets]
  );

  return (
    <DashboardContent>
      <NewAccountModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        onSubmit={handleNewAccount}
      />

      <NewAssetModal
        open={openNewAsset}
        onClose={() => setOpenNewAsset(false)}
        onSubmit={handleNewAsset}
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
          startIcon={<Iconify icon="brands:plaid" />}
          onClick={() => open()}
          disabled={!ready || !linkToken} // Disable if not ready or no token
          sx={{ mr: 1 }}
        >
          Link Accounts
        </Button>
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
        {accounts?.map((account) => (
          <Grid key={account.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <AccountItem
              account={account}
              onDelete={handleDeleteAccount}
              onUpdate={handleUpdateAccount}
            />
          </Grid>
        ))}
      </Grid>

      {accounts == null && !error && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Accounts Loading!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please wait while we fetch your accounts
          </Typography>
        </Box>
      )}

      {accounts != null && accounts.length === 0 && !error && (
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

      {/* Assets Section */}
      <Box
        sx={{
          mb: 5,
          mt: 8,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Assets
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setOpenNewAsset(true)}
        >
          New Asset
        </Button>
      </Box>

      <Grid container spacing={3}>
        {assets?.map((asset) => (
          <Grid key={asset.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <AssetItem asset={asset} onDelete={handleDeleteAsset} onUpdate={handleUpdateAsset} />
          </Grid>
        ))}
      </Grid>

      {assets == null && !error && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Assets Loading!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please wait while we fetch your assets
          </Typography>
        </Box>
      )}

      {assets != null && assets.length === 0 && !error && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            No assets found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first asset to start tracking your wealth
          </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setOpenNewAsset(true)}
          >
            Add Asset
          </Button>
        </Box>
      )}
    </DashboardContent>
  );
}
