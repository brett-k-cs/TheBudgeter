import type { TextFieldProps } from '@mui/material';

import React from 'react';

import { TextField, InputAdornment } from '@mui/material';

type MoneyInputProps = {
  value: string;
  setValue: (value: string) => void;
} & TextFieldProps;

export function MoneyInput({ value, setValue, ...other } : MoneyInputProps) {

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Format number string as money (e.g. "1234" => "1,234")
  const formatMoney = (val: string) => {
    const number = Number(val.replace(/[^0-9.]/g, ''));
    if (isNaN(number)) return '';
    return number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;

    // Remove all non-numeric except dot
    const rawValue = el.value.replace(/[^0-9.]/g, '');

    // Save cursor position before formatting
    const selectionStart = el.selectionStart ?? 0;
    const oldValue = value;

    // Format number
    const formattedValue = formatMoney(rawValue);
    setValue(formattedValue);
    
    // Restore cursor after updating state and formatting
    // This is delayed to next event loop to ensure DOM updated
    setTimeout(() => {
      if (!inputRef.current) return;

      let newPos = selectionStart;

      // Calculate cursor shift due to commas inserted/removed
      const oldCommasBeforeCursor = (oldValue.slice(0, selectionStart).match(/,/g) || []).length;
      const newCommasBeforeCursor = (formattedValue.slice(0, newPos).match(/,/g) || []).length;

      newPos += newCommasBeforeCursor - oldCommasBeforeCursor;

      inputRef.current.selectionStart = newPos;
      inputRef.current.selectionEnd = newPos;
    }, 0);
  };

  return (
    <TextField
      inputRef={inputRef}
      value={value}
      onChange={handleChange}
      type="text"
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }
      }}
      fullWidth
      {...other}
    />
  );
}