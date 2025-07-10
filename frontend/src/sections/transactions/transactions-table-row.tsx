import dayjs from 'dayjs';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import { Select, TextField, FormControl } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { fDateTime } from 'src/utils/format-time';
import { handleRequest } from 'src/utils/handle-request';

import { categories } from 'src/_mock/_categories';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { MoneyInput } from 'src/components/money-input/money-input';

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
  onUpdateRow: (id: string, updatedData: Partial<TransactionProps>) => void;
};

export function TransactionsTableRow({ row, selected, onSelectRow, onDeleteRow, onUpdateRow }: TransactionsTableRowProps) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    description: row.description,
    category: row.category,
    amount: Math.abs(row.amount).toString(),
    date: dayjs(row.date),
    type: row.type
  });

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleDeleteRow = useCallback(async () => {
    console.log(`Deleting transaction with ID: ${row.id}`);

    await handleRequest(`/api/transactions/${row.id}`,'DELETE');

    setOpenPopover(null);
    onDeleteRow(row.id);
  }, [row.id, onDeleteRow]);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleEditClick = useCallback(() => {
    setIsEditing(true);
    setOpenPopover(null);
  }, []);

  const handleCellDoubleClick = useCallback((field: string) => {
    if (!isEditing) {
      setIsEditing(true);
    }
  }, [isEditing]);

  const handleSaveEdit = useCallback(async () => {
    const updatedData = {
      description: editData.description,
      category: editData.category,
      amount: parseFloat(editData.amount),
      date: editData.date.toDate(),
      type: editData.type
    };

    const result = await handleRequest(
      `/api/transactions/${row.id}`,
      'PUT',
      undefined,
      true,
      updatedData
    );

    if (result) {
      onUpdateRow(row.id, updatedData);
      setIsEditing(false);
    }
  }, [row.id, editData, onUpdateRow]);

  const handleCancelEdit = useCallback(() => {
    setEditData({
      description: row.description,
      category: row.category,
      amount: Math.abs(row.amount).toString(),
      date: dayjs(row.date),
      type: row.type
    });
    setIsEditing(false);
  }, [row]);

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
        </TableCell>

        <TableCell onDoubleClick={() => handleCellDoubleClick('date')}>
          {isEditing ? (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                value={editData.date}
                onChange={(newDate) => newDate && setEditData(prev => ({ ...prev, date: newDate }))}
                slotProps={{ textField: { size: 'small', variant: 'standard' } }}
                viewRenderers={{
                  hours: renderTimeViewClock,
                  minutes: renderTimeViewClock,
                  seconds: renderTimeViewClock,
                }}
              />
            </LocalizationProvider>
          ) : (
            fDateTime(row.date)
          )}
        </TableCell>

        <TableCell onDoubleClick={() => handleCellDoubleClick('description')}>
          {isEditing ? (
            <TextField
              value={editData.description}
              onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              variant="standard"
              size="small"
              fullWidth
            />
          ) : (
            row.description
          )}
        </TableCell>

        <TableCell onDoubleClick={() => handleCellDoubleClick('category')}>
          {isEditing ? (
            <FormControl variant="standard" size="small" fullWidth>
              <Select
                value={editData.category}
                onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
              >
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            categories.find(a => a.id === row.category)?.label || row.category
          )}
        </TableCell>

        <TableCell onDoubleClick={() => handleCellDoubleClick('amount')}>
          {isEditing ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl variant="standard" size="small" fullWidth>
                <Select
                  value={editData.type}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'withdrawal' || value === 'deposit') {
                      setEditData(prev => ({ ...prev, type: value }));
                    }
                  }}
                >
                  <MenuItem value="withdrawal">Withdrawal</MenuItem>
                  <MenuItem value="deposit">Deposit</MenuItem>
                </Select>
              </FormControl>
              <MoneyInput
                value={editData.amount}
                setValue={(value) => setEditData(prev => ({ ...prev, amount: value }))}
                variant="standard"
                size="small"
              />
            </Box>
          ) : (
            <Label color={row.type === 'deposit' ? 'success' : 'error'}>
              ${Math.abs(row.amount).toFixed(2)}
            </Label>
          )}
        </TableCell>

        <TableCell align="right">
          {isEditing ? (
            <>
              <IconButton onClick={handleSaveEdit} color="primary" size="small">
                <Iconify icon="eva:checkmark-fill" />
              </IconButton>
              <IconButton onClick={handleCancelEdit} color="error" size="small">
                <Iconify icon="mingcute:close-line" />
              </IconButton>
            </>
          ) : (
            <IconButton onClick={handleOpenPopover}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          )}
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
          <MenuItem onClick={handleEditClick}>
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
