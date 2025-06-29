import { useState, useCallback } from 'react';

import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { fDateTime } from 'src/utils/format-time';
import { handleRequest } from 'src/utils/handle-request';

import { categories } from 'src/_mock/_categories';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type TransactionProps = {
  id: string;
  type: 'withdrawal' | 'deposit'
  date: Date;
  description: string;
  category: string;
  amount: number;
};

type TransactionsTableRowProps = {
  row: TransactionProps;
  selected: boolean;
  onSelectRow: () => void;
  onDeleteRow: (id: any) => void;
};

export function TransactionsTableRow({ row, selected, onSelectRow, onDeleteRow }: TransactionsTableRowProps) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleDeleteRow = useCallback(async () => {
    console.log(`Deleting transaction with ID: ${row.id}`);

    await handleRequest(`/api/transactions/${row.id}`,'DELETE');

    setOpenPopover(null);

    onDeleteRow(row.id);
  }, [row.id]);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
        </TableCell>

        <TableCell>{fDateTime(row.date)}</TableCell>

        <TableCell>{row.description}</TableCell>

        <TableCell>{categories.find(a => a.id == row.category)?.label || row.category}</TableCell>

        <TableCell>
          <Label color={row.type == 'deposit' ? 'success' : 'error'}>${Math.abs(row.amount).toFixed(2)}</Label>
        </TableCell>

        <TableCell align="right">
          <IconButton onClick={handleOpenPopover}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 140,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              px: 1,
              gap: 2,
              borderRadius: 0.75,
              [`&.${menuItemClasses.selected}`]: { bgcolor: 'action.selected' },
            },
          }}
        >
          <MenuItem onClick={handleClosePopover}>
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>

          <MenuItem onClick={handleDeleteRow} sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </Popover>
    </>
  );
}
