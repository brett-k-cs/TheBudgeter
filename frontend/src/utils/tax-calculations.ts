import type { TransactionProps } from 'src/sections/transactions/transactions-table-row';

// Tax rates
const DEDUCTION_AMT = 15000;

export const TAX_RATES = {
  year: 2025,
  INCOME_TAX: [
    {
      low: 0,
      high: DEDUCTION_AMT,
      rate: 0,
    },
    {
      low: DEDUCTION_AMT + 1,
      high: DEDUCTION_AMT + 11925,
      rate: 0.1, // 10% income tax for income between $15,001 and $40,000
    },
    {
      low: 15001 + 11925 + 1,
      high: DEDUCTION_AMT + 48475,
      rate: 0.12, // 12% income tax
    },
    {
      low: 15001 + 48475 + 1,
      high: DEDUCTION_AMT + 103350,
      rate: 0.22,
    },
    {
      low: DEDUCTION_AMT + 103350 + 1,
      high: DEDUCTION_AMT + 197300,
      rate: 0.24,
    },
    {
      low: DEDUCTION_AMT + 197300 + 1,
      high: DEDUCTION_AMT + 250525,
      rate: 0.32,
    },
    {
      low: DEDUCTION_AMT + 250525 + 1,
      high: DEDUCTION_AMT + 626350,
      rate: 0.35,
    },
    {
      low: DEDUCTION_AMT + 626350 + 1,
      high: Infinity,
      rate: 0.37,
    },
  ],
  SOCIAL_SECURITY: 0.062, // 6.2% Social Security tax
  MEDICARE: 0.0145, // 1.45% Medicare tax
  SELF_EMPLOYMENT: 0.9235, // 92.35% of SE income subject to SE tax
} as const;

export type TaxCategory = 'w2' | '1099' | 'none' | undefined;

export interface TaxedTransaction extends TransactionProps {
  taxCategory: TaxCategory;
}

export interface TaxEstimate {
  w2Income: number;
  w2GrossIncome: number;
  w2SocialSecurityWithheld: number;
  w2MedicareWithheld: number;
  w2TotalWithheld: number;
  income1099: number;
  totalIncome: number;
  incomeTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  selfEmploymentTax: number;
  totalTaxOwed: number;
}

function calculateProgressiveIncomeTax(income: number): number {
  let totalTax = 0;
  let remainingIncome = income;

  for (const bracket of TAX_RATES.INCOME_TAX) {
    if (remainingIncome <= 0) break;

    const taxableInThisBracket = Math.min(
      remainingIncome,
      bracket.high - bracket.low + 1
    );

    if (income > bracket.low) {
      totalTax += taxableInThisBracket * bracket.rate;
      remainingIncome -= taxableInThisBracket;
    }
  }

  return totalTax;
}

export function calculateTaxEstimate(transactions: TaxedTransaction[]): TaxEstimate {
  // Filter to only include income transactions (deposits) that are tax-categorized
  const incomeTransactions = transactions.filter(
    (transaction) =>
      transaction.type === 'deposit' &&
      (transaction.taxCategory === 'w2' || transaction.taxCategory === '1099')
  );

  // W-2 income: net amount received (taxes already withheld)
  const w2NetIncome = incomeTransactions
    .filter((transaction) => transaction.taxCategory === 'w2')
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  // Calculate gross W-2 income (reverse engineer from net)
  // Net = Gross - SS - Medicare, so Gross = Net / (1 - SS_rate - Medicare_rate)
  const w2TaxRate = TAX_RATES.SOCIAL_SECURITY + TAX_RATES.MEDICARE;
  const w2GrossIncome = w2NetIncome / (1 - w2TaxRate);

  // Calculate what was already withheld for W-2
  const w2SocialSecurityWithheld = w2GrossIncome * TAX_RATES.SOCIAL_SECURITY;
  const w2MedicareWithheld = w2GrossIncome * TAX_RATES.MEDICARE;
  const w2TotalWithheld = w2SocialSecurityWithheld + w2MedicareWithheld;

  // 1099 income: full amount received (no taxes withheld)
  const income1099 = incomeTransactions
    .filter((transaction) => transaction.taxCategory === '1099')
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  // Total gross income for tax purposes
  const totalIncome = w2GrossIncome + income1099;

  // Calculate progressive income tax
  const incomeTax = calculateProgressiveIncomeTax(totalIncome);

  // Self-employment tax only applies to 1099 income
  const selfEmploymentIncome = income1099 * TAX_RATES.SELF_EMPLOYMENT;
  const socialSecurityTax = selfEmploymentIncome * TAX_RATES.SOCIAL_SECURITY;
  const medicareTax = selfEmploymentIncome * TAX_RATES.MEDICARE;
  const selfEmploymentTax = socialSecurityTax + medicareTax;

  const totalTaxOwed = incomeTax + (selfEmploymentTax * 2);

  return {
    w2Income: w2NetIncome, // Keep as net for display purposes
    w2GrossIncome,
    w2SocialSecurityWithheld,
    w2MedicareWithheld,
    w2TotalWithheld,
    income1099,
    totalIncome,
    incomeTax,
    socialSecurityTax,
    medicareTax,
    selfEmploymentTax,
    totalTaxOwed,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatPercentage(rate: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(rate);
}
