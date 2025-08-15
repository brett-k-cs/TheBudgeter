import type { TaxedTransaction, TaxCategory } from 'src/utils/tax-calculations';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import FormControl from '@mui/material/FormControl';

import { fDateTime } from 'src/utils/format-time';

import { categories } from 'src/_mock/_categories';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type TaxTableRowProps = {
  row: TaxedTransaction;
  selected: boolean;
  maxDescriptionWidth?: number;
  onSelectRow: () => void;
  onTaxCategoryChange: (transactionId: string, category: TaxCategory) => void;
};

export function TaxTableRow({ row, selected, maxDescriptionWidth, onSelectRow, onTaxCategoryChange }: TaxTableRowProps) {
  const handleTaxCategoryChange = useCallback((newCategory: TaxCategory) => {
    onTaxCategoryChange(row.id, newCategory);
  }, [row.id, onTaxCategoryChange]);

  const getTaxCategoryColor = (category: TaxCategory) => {
    switch (category) {
      case 'w2':
        return 'info';
      case '1099':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTaxCategoryLabel = (category: TaxCategory) => {
    switch (category) {
      case 'w2':
        return 'W-2 Income';
      case '1099':
        return '1099 Income';
      default:
        return 'Not Set';
    }
  };

  // Only show tax category dropdown for deposit transactions (income)
  const isIncomeTransaction = row.type === 'deposit';

  return (
    <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
      </TableCell>

      <TableCell>{fDateTime(row.date)}</TableCell>

      <TableCell>
        {maxDescriptionWidth && row.description.length > maxDescriptionWidth
          ? `${row.description.slice(0, maxDescriptionWidth - 3)}...`
          : row.description}
      </TableCell>

      <TableCell>
        {categories.find(a => a.id === row.category)?.label || row.category}
      </TableCell>

      <TableCell>
        <Label color={row.type === 'deposit' ? 'success' : 'error'}>
          ${Math.abs(row.amount).toFixed(2)}
        </Label>
      </TableCell>

      <TableCell>
        {isIncomeTransaction ? (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={row.taxCategory}
              onChange={(e) => handleTaxCategoryChange(e.target.value as TaxCategory)}
              variant="outlined"
              size="small"
            >
              <MenuItem value="none">Not Set</MenuItem>
              <MenuItem value="w2">W-2 Income</MenuItem>
              <MenuItem value="1099">1099 Income</MenuItem>
            </Select>
          </FormControl>
        ) : (
          <Chip
            label="N/A (Expense)"
            size="small"
            color="default"
            variant="outlined"
            disabled
          />
        )}
      </TableCell>

      <TableCell align="right">
        {isIncomeTransaction && row.taxCategory !== 'none' && (
          <Chip
            label={getTaxCategoryLabel(row.taxCategory)}
            size="small"
            color={getTaxCategoryColor(row.taxCategory)}
            variant="filled"
          />
        )}
      </TableCell>
    </TableRow>
  );
}
