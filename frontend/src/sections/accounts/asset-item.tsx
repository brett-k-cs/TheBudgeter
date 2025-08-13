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

import { AssetDetailsModal } from './asset-details-modal';

// ----------------------------------------------------------------------

export interface AssetProps {
  id: string;
  name: string;
  type: 'property' | 'automobile' | 'collectibles' | 'other';
  valuation: number;
  ownershipPercentage?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AssetItemProps {
  asset: AssetProps;
  onDelete?: (assetId: string) => void;
  onUpdate?: (assetId: string, assetData: Partial<AssetProps>) => void;
}

const getAssetTypeLabel = (type: AssetProps['type']) => {
  switch (type) {
    case 'property':
      return 'Property';
    case 'automobile':
      return 'Automobile';
    case 'collectibles':
      return 'Collectibles';
    case 'other':
      return 'Other';
    default:
      return 'Unknown';
  }
};

const getAssetTypeColor = (type: AssetProps['type']) => {
  switch (type) {
    case 'property':
      return 'primary';
    case 'automobile':
      return 'secondary';
    case 'collectibles':
      return 'warning';
    case 'other':
      return 'default';
    default:
      return 'default';
  }
};

const getAssetIcon = (type: AssetProps['type']) => {
  switch (type) {
    case 'property':
      return 'solar:home-bold';
    case 'automobile':
      return 'solar:cart-3-bold';
    case 'collectibles':
      return 'solar:money-bag-bold';
    case 'other':
    default:
      return 'solar:wallet-bold';
  }
};

export function AssetItem({ asset, onDelete, onUpdate }: AssetItemProps) {
  const [openDetails, setOpenDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this asset?')) {
      onDelete(asset.id);
    }
  };

  const handleUpdate = (assetData: Partial<AssetProps>) => {
    if (onUpdate) {
      onUpdate(asset.id, assetData);
    }
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          position: 'relative',
          transition: 'all 0.3s ease-in-out',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: (theme) => theme.shadows[8],
          },
        }}
        onClick={() => setOpenDetails(true)}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            {/* Header */}
            <Box
              sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify
                  icon={getAssetIcon(asset.type)}
                  sx={{
                    width: 24,
                    height: 24,
                    color: `${getAssetTypeColor(asset.type)}.main`,
                  }}
                />
                <Typography variant="h6" noWrap>
                  {asset.name}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDetails(true);
                    setIsEditing(true);
                  }}
                  sx={{
                    opacity: 0.7,
                    '&:hover': { opacity: 1 },
                  }}
                >
                  <Iconify icon="mingcute:edit-line" width={16} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  sx={{
                    opacity: 0.7,
                    '&:hover': { opacity: 1, color: 'error.main' },
                  }}
                >
                  <Iconify icon="mingcute:delete-2-line" width={16} />
                </IconButton>
              </Box>
            </Box>

            {/* Asset Type */}
            <Box>
              <Chip
                label={getAssetTypeLabel(asset.type)}
                color={getAssetTypeColor(asset.type) as any}
                size="small"
                variant="outlined"
              />
            </Box>

            {/* Ownership Percentage - only show if not 100% */}
            {asset.ownershipPercentage !== undefined && asset.ownershipPercentage !== 100 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Ownership
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {asset.ownershipPercentage}%
                </Typography>
              </Box>
            )}

            {/* Valuation */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Valuation
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  color: 'success.main',
                  fontWeight: 'bold',
                }}
              >
                {fCurrency(asset.valuation)}
              </Typography>
            </Box>

            {/* Description */}
            {asset.description && (
              <Box>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {asset.description}
                </Typography>
              </Box>
            )}

            {/* Footer */}
            <Box sx={{ pt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Updated {asset.updatedAt.toLocaleDateString()}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <AssetDetailsModal
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        asset={asset}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
    </>
  );
}
