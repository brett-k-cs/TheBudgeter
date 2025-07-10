import type { Dayjs } from 'dayjs';

import { useState } from 'react';

import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Grid, Select, MenuItem, Collapse, InputLabel, FormControl } from '@mui/material';

import { categories } from 'src/_mock/_categories';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type FilterOptions = {
  searchText: string;
  category: string;
  type: string;
  dateFrom: Dayjs | null;
  dateTo: Dayjs | null;
  amountMin: string;
  amountMax: string;
};

type UserTableToolbarProps = {
  numSelected: number;
  filterName: string;
  onFilterName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteSelected: () => void;
  filterOptions: FilterOptions;
  onFilterOptionsChange: (options: FilterOptions) => void;
};

export function UserTableToolbar({ 
  numSelected, 
  filterName, 
  onFilterName, 
  onDeleteSelected,
  filterOptions,
  onFilterOptionsChange
}: UserTableToolbarProps) {
  const [expandedFilters, setExpandedFilters] = useState(false);

  const handleFilterToggle = () => {
    setExpandedFilters(!expandedFilters);
  };

  const updateFilterOption = (key: keyof FilterOptions, value: any) => {
    onFilterOptionsChange({
      ...filterOptions,
      [key]: value
    });
  };

  return (
    <>
      <Toolbar
        sx={{
          height: 96,
          display: 'flex',
          justifyContent: 'space-between',
          p: (theme) => theme.spacing(0, 1, 0, 3),
          ...(numSelected > 0 && {
            color: 'primary.main',
            bgcolor: 'primary.lighter',
          }),
        }}
      >
        {numSelected > 0 ? (
          <Typography component="div" variant="subtitle1">
            {numSelected} selected
          </Typography>
        ) : (
          <OutlinedInput
            fullWidth
            value={filterName}
            onChange={onFilterName}
            placeholder="Search transaction..."
            startAdornment={
              <InputAdornment position="start">
                <Iconify width={20} icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            }
            sx={{ maxWidth: 320 }}
          />
        )}

        {numSelected > 0 ? (
          <Tooltip title="Delete">
            <IconButton onClick={onDeleteSelected}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Filter list">
            <IconButton onClick={handleFilterToggle}>
              <Iconify icon={expandedFilters ? "ic:round-filter-list-off" : "ic:round-filter-list"} />
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
      
      <Collapse in={expandedFilters}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }} >
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterOptions.category}
                  label="Category"
                  onChange={(e) => updateFilterOption('category', e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterOptions.type}
                  label="Type"
                  onChange={(e) => updateFilterOption('type', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="deposit">Deposit</MenuItem>
                  <MenuItem value="withdrawal">Withdrawal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="From Date"
                value={filterOptions.dateFrom}
                onChange={(date) => updateFilterOption('dateFrom', date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="To Date"
                value={filterOptions.dateTo}
                onChange={(date) => updateFilterOption('dateTo', date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OutlinedInput
                size="small"
                fullWidth
                placeholder="Min Amount"
                value={filterOptions.amountMin}
                onChange={(e) => updateFilterOption('amountMin', e.target.value)}
                startAdornment={<InputAdornment position="start">$</InputAdornment>}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OutlinedInput
                size="small"
                fullWidth
                placeholder="Max Amount"
                value={filterOptions.amountMax}
                onChange={(e) => updateFilterOption('amountMax', e.target.value)}
                startAdornment={<InputAdornment position="start">$</InputAdornment>}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Collapse>
    </>
  );
}