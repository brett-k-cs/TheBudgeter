import { fDateTime } from 'src/utils/format-time';

import type { TransactionProps } from './transactions-table-row';

// ----------------------------------------------------------------------

export const visuallyHidden = {
  border: 0,
  margin: -1,
  padding: 0,
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  clip: 'rect(0 0 0 0)',
} as const;

// ----------------------------------------------------------------------

export function emptyRows(page: number, rowsPerPage: number, arrayLength: number) {
  return page ? Math.max(0, (1 + page) * rowsPerPage - arrayLength) : 0;
}

// ----------------------------------------------------------------------

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

// ----------------------------------------------------------------------

export function getComparator<Key extends keyof any>(
  order: 'asc' | 'desc',
  orderBy: Key
): (
  a: {
    [key in Key]: number | string;
  },
  b: {
    [key in Key]: number | string;
  }
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: TransactionProps[];
  filterName: string;
  comparator: (a: any, b: any) => number;
};

export function applyFilter({ inputData, comparator, filterName }: ApplyFilterProps) {
  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (filterName) {
    if (filterName.includes("OR")) {
      const filterParts = filterName.split("OR").map(part => part.trim()).filter(part => part.length > 0);
      inputData = inputData.filter((transaction) =>
        filterParts.some(part =>
          transaction.description.toLowerCase().includes(part.toLowerCase()) ||
          transaction.category.toLowerCase().includes(part.toLowerCase()) ||
          transaction.type.toLowerCase().includes(part.toLowerCase()) ||
          transaction.amount.toString().toLowerCase().includes(part.toLowerCase()) ||
          fDateTime(transaction.date).toLowerCase().includes(part.toLowerCase())
        )
      );
    } else {
      inputData = inputData.filter(
        (transaction) => transaction.description.toLowerCase().indexOf(filterName.toLowerCase()) !== -1 ||
          transaction.category.toLowerCase().indexOf(filterName.toLowerCase()) !== -1 ||
          transaction.type.toLowerCase().indexOf(filterName.toLowerCase()) !== -1 ||
          transaction.amount.toString().toLowerCase().indexOf(filterName.toLowerCase()) !== -1 ||
          fDateTime(transaction.date).toLowerCase().indexOf(filterName.toLowerCase()) !== -1
      );
    }
  }

  return inputData;
}
