import type { BudgetProps } from 'src/sections/budgets/budget-item';

export const _budgets: BudgetProps[] = [
  {
    id: '1',
    name: 'Monthly Food',
    startDate: new Date(2024, 0, 1), // January 1, 2024
    endDate: new Date(2024, 0, 31), // January 31, 2024
    categories: {
      groceries: {
        budgeted: 500,
        spent: 450,
      },
      dining: {
        budgeted: 300,
        spent: 200,
      },
    },
  },
  {
    id: '2',
    name: 'Home',
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 0, 31),
    categories: {
      utilities: {
        budgeted: 200,
        spent: 110,
      },
      home_garden: {
        budgeted: 100,
        spent: 120,
      },
    },
  },
  {
    id: '3',
    name: 'Entertainment',
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 0, 31),
    categories: {
      entertainment: {
        budgeted: 30,
        spent: 30,
      },
      health_fitness: {
        budgeted: 10,
        spent: 10,
      },
    },
  },
  {
    id: '4',
    name: 'Transportation',
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 0, 31),
    categories: {
      gas: {
        budgeted: 150,
        spent: 140,
      },
      automotive: {
        budgeted: 100,
        spent: 50,
      },
      transportation: {
        budgeted: 0,
        spent: 0,
      },
    },
  }
];