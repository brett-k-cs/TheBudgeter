import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { handleRequest } from 'src/utils/handle-request';

import { categories } from 'src/_mock/_categories';
import { DashboardContent } from 'src/layouts/dashboard';

import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsSpendingHabits } from '../analytics-spending-habits';
import { AnalyticsBudgetCategories } from '../analytics-budget-categories';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const [monthlyIncome, setMonthlyIncome] = useState<Record<string, any>>({});
  const [monthlySpending, setMonthlySpending] = useState<Record<string, any>>({});
  const [netWorth, setNetWorth] = useState<Record<string, any>>({});
  const [primaryBudget, setPrimaryBudget] = useState<Record<string, any> | null>(null);
  const [spendingByCategory, setSpendingByCategory] = useState<Record<string, any>>({});
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return { startDate, endDate };
  });

  // Fetch spending by category data
  const fetchSpendingByCategory = async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const url = `/api/dashboard/spendingByCategory${params.toString() ? `?${params.toString()}` : ''}`;
    const responseSpendingByCategory = await handleRequest(url, 'GET', undefined, true);
    
    if (responseSpendingByCategory?.success) {
      setSpendingByCategory({
        labels: responseSpendingByCategory.data.labels,
        data: responseSpendingByCategory.data.values,
      });

      console.log(
        'Spending by Category:',
        responseSpendingByCategory.data.values.length > 0
          ? responseSpendingByCategory.data.values.map((value: number, index: number) => ({
              label: responseSpendingByCategory.data.labels[index],
              data: value,
            }))
          : []
      );
    }
  };

  // Fetch all summary data
  useEffect(() => {
    const fetchSummaries = async () => {
      const responseReport = await handleRequest('/api/dashboard/monthlyReport', 'GET', undefined, true);
      if (responseReport?.success) {
        setMonthlyIncome({
          labels: responseReport.income.labels,
          data: responseReport.income.data,
        });
        setMonthlySpending({
          labels: responseReport.spending.labels,
          data: responseReport.spending.data,
        });
      }

      // Fetch spending by category with current date range
      await fetchSpendingByCategory(dateRange.startDate, dateRange.endDate);

      // Fetch primary budget
      const responsePrimary = await handleRequest('/api/budgets/primary', 'GET', undefined, true);
      if (responsePrimary?.success) {
        setPrimaryBudget(responsePrimary.data || null);
      }

      // Fetch net worth
      const responseNetWorth = await handleRequest('/api/dashboard/netWorth', 'GET', undefined, true);
      if (responseNetWorth?.success) {
        setNetWorth(responseNetWorth.data || {});
      }
    };

    fetchSummaries();
  }, [dateRange.startDate, dateRange.endDate]);

  const handleDateRangeChange = async (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
    await fetchSpendingByCategory(startDate, endDate);
  };

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        {/* ... existing widget summaries ... */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Monthly Income"
            percent={
              monthlyIncome.data && monthlyIncome.data.length > 1
                ? ((monthlyIncome.data[monthlyIncome.data.length - 1] -
                    monthlyIncome.data[monthlyIncome.data.length - 2]) /
                    monthlyIncome.data[monthlyIncome.data.length - 2]) *
                  100
                : 0
            }
            total={(monthlyIncome.data && monthlyIncome.data[monthlyIncome.data.length - 1]) || 0}
            icon={<img alt="Monthly Income" src="/assets/icons/glass/ic-glass-bag.svg" />}
            chart={{
              categories: monthlyIncome?.labels || [],
              series: monthlyIncome?.data || [],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Monthly Spending"
            percent={
              monthlySpending.data && monthlySpending.data.length > 1
                ? ((monthlySpending.data[monthlySpending.data.length - 1] -
                    monthlySpending.data[monthlySpending.data.length - 2]) /
                    monthlySpending.data[monthlySpending.data.length - 2]) *
                  100
                : 0
            }
            total={
              (monthlySpending.data && monthlySpending.data[monthlySpending.data.length - 1]) || 0
            }
            color="warning"
            icon={<img alt="Monthly Spending" src="/assets/icons/glass/ic-glass-buy.svg" />}
            chart={{
              categories: monthlySpending?.labels || [],
              series: monthlySpending?.data || [],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Net Worth"
            percent={2.8}
            total={netWorth?.totalNetWorth}
            color="success"
            icon={<img alt="Net Worth" src="/assets/icons/glass/ic-glass-cash.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [40, 70, 50, 28, 70, 75, 7, 64],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Primary Budget %"
            percent={
              primaryBudget
                ? (() => {
                    const totalBudgeted = Object.values(primaryBudget.categories || {}).reduce(
                      (sum: number, cat: any) => sum + cat.budgeted,
                      0
                    );
                    const totalSpent = Object.values(primaryBudget.categories || {}).reduce(
                      (sum: number, cat: any) => sum + cat.spent,
                      0
                    );
                    return totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
                  })()
                : 0
            }
            total={
              primaryBudget
                ? (() => {
                    const totalBudgeted = Object.values(primaryBudget.categories || {}).reduce(
                      (sum: number, cat: any) => sum + cat.budgeted,
                      0
                    );
                    const totalSpent = Object.values(primaryBudget.categories || {}).reduce(
                      (sum: number, cat: any) => sum + cat.spent,
                      0
                    );
                    return totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
                  })()
                : 0
            }
            color="error"
            icon={<img alt="Messages" src="/assets/icons/glass/ic-glass-message.svg" />}
            chart={{
              categories: Object.keys(primaryBudget?.categories || {}).map(
                (id) => categories.find((cat) => cat.id === id)?.label || id
              ),
              series: Object.values(primaryBudget?.categories || {}).map((cat: any) => cat.spent),
            }}
          />
        </Grid>

        <Grid container spacing={2} alignItems="stretch" size={{ xs: 12, md: 12, lg: 12 }}>
          <Grid size={{ xs: 12, md: 6, lg: 6 }}>
            <AnalyticsSpendingHabits
              title="Monthly Spending"
              chart={{
                series:
                  spendingByCategory &&
                  Array.isArray(spendingByCategory.data) &&
                  Array.isArray(spendingByCategory.labels)
                    ? spendingByCategory.data.map((value: number, index: number) => ({
                        label: categories.find(cat => cat.id === spendingByCategory.labels[index])?.label || spendingByCategory.labels[index],
                        value,
                      }))
                    : [],
              }}
              onDateRangeChange={handleDateRangeChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6, lg: 6 }}>
            <AnalyticsBudgetCategories
              title="Monthly Budget Progress"
              subheader={
                primaryBudget
                  ? `$${Object.values(primaryBudget.categories || {}).reduce(
                      (sum: number, cat: any) => sum + (cat.budgeted - cat.spent),
                      0
                    )} total left`
                  : ''
              }
              chart={{
                categories: Object.keys(primaryBudget?.categories || {}).map(
                  (id) => categories.find((cat) => cat.id === id)?.label || id
                ),
                series: [
                  {
                    name: 'Current',
                    data: Object.values(primaryBudget?.categories || {}).map((cat: any) => cat.spent),
                  },
                  {
                    name: 'Allocated',
                    data: Object.values(primaryBudget?.categories || {}).map((cat: any) => cat.budgeted),
                  },
                ],
              }}
              style={{ height: '100%' }}
            />
          </Grid>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
