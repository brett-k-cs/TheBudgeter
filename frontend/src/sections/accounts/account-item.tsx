import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

import { EditAccountModal } from './edit-account-modal';

// ----------------------------------------------------------------------

export interface AccountProps {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'investment' | 'other';
  balance: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  isPlaid: boolean;
}

interface AccountItemProps {
  account: AccountProps;
  onDelete?: (accountId: string) => void;
  onUpdate?: (accountId: string, accountData: Partial<AccountProps>) => void;
}

const getAccountTypeLabel = (type: AccountProps['type']) => {
  switch (type) {
    case 'checking':
      return 'Checking';
    case 'savings':
      return 'Savings';
    case 'credit_card':
      return 'Credit Card';
    case 'investment':
      return 'Investment';
    case 'other':
      return 'Other';
    default:
      return 'Unknown';
  }
};

const getAccountTypeColor = (type: AccountProps['type']) => {
  switch (type) {
    case 'checking':
      return 'primary';
    case 'savings':
      return 'success';
    case 'credit_card':
      return 'warning';
    case 'investment':
      return 'info';
    case 'other':
      return 'default';
    default:
      return 'default';
  }
};

const getAccountIcon = (type: AccountProps['type']) => {
  switch (type) {
    case 'checking':
      return 'solar:wallet-bold';
    case 'savings':
      return 'solar:home-angle-bold-duotone';
    case 'credit_card':
      return 'solar:card-2-bold';
    case 'investment':
      return 'solar:graph-up-bold';
    case 'other':
      return 'solar:settings-bold-duotone';
    default:
      return 'solar:wallet-bold';
  }
};

export function AccountItem({ account, onDelete, onUpdate }: AccountItemProps) {
  const [openEdit, setOpenEdit] = useState(false);

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this account?')) {
      onDelete(account.id);
    }
  };

  const handleUpdate = (accountData: Partial<AccountProps>) => {
    if (onUpdate) {
      onUpdate(account.id, accountData);
    }
    setOpenEdit(false);
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          position: 'relative',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: (theme) => theme.shadows[8],
          },
        }}
      >
        {/* Plaid indicator diagonal strip */}
        {account.isPlaid && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 0,
              height: 0,
              borderLeft: '64px solid transparent',
              borderBottom: '64px solid',
              borderBottomColor: 'primary.main',
              zIndex: 1,
            }}
          />
        )}

        {/* Plaid icon on the strip */}
        {account.isPlaid && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              zIndex: 2,
            }}
          >
            <Iconify
              icon="brands:plaid"
              sx={{
                width: 24,
                height: 24,
                color: 'white',
                transform: 'rotate(45deg)',
              }}
            />
          </Box>
        )}

        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            {/* Header */}
            <Box
              sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify
                  icon={getAccountIcon(account.type)}
                  sx={{
                    width: 24,
                    height: 24,
                    color: `${getAccountTypeColor(account.type)}.main`,
                  }}
                />
                <Typography variant="h6" noWrap>
                  {account.name}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={() => setOpenEdit(true)}
                  sx={{
                    opacity: 0.7,
                    '&:hover': { opacity: 1 },
                  }}
                >
                  <Iconify icon="mingcute:edit-line" width={16} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleDelete}
                  sx={{
                    opacity: 0.7,
                    '&:hover': { opacity: 1, color: 'error.main' },
                  }}
                >
                  <Iconify icon="mingcute:delete-2-line" width={16} />
                </IconButton>
              </Box>
            </Box>

            {/* Account Type */}
            <Box>
              <Chip
                label={getAccountTypeLabel(account.type)}
                color={getAccountTypeColor(account.type) as any}
                size="small"
                variant="outlined"
              />
            </Box>

            {/* Balance */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Balance
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  color: account.balance >= 0 ? 'success.main' : 'error.main',
                  fontWeight: 'bold',
                }}
              >
                {fCurrency(account.balance)}
              </Typography>
            </Box>

            {/* Description */}
            {account.description && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {account.description}
                </Typography>
              </Box>
            )}

            {/* Footer */}
            <Box sx={{ pt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Created {account.createdAt.toLocaleDateString()}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <EditAccountModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSubmit={handleUpdate}
        account={account}
      />
    </>
  );
}
