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
  const [checkingBalance, setCheckingBalance] = useState<Record<string, any>>({});
  const [primaryBudget, setPrimaryBudget] = useState<Record<string, any>>({});
  const [spendingByCategory, setSpendingByCategory] = useState<Record<string, any>>({});

  // Fetch all summary data
  useEffect(() => {
    const fetchSummaries = async () => {
      const responseReport = await handleRequest('/api/dashboard/monthlyReport');
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

      const responseSpendingByCategory = await handleRequest('/api/dashboard/spendingByCategory');
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

    fetchSummaries();
  }, []);

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
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
            title="Checking Balance"
            percent={2.8}
            total={1302}
            color="success"
            icon={<img alt="Checking Balance" src="/assets/icons/glass/ic-glass-cash.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [40, 70, 50, 28, 70, 75, 7, 64],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Primary Budget %"
            percent={3.6}
            total={83}
            color="error"
            icon={<img alt="Messages" src="/assets/icons/glass/ic-glass-message.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [56, 30, 23, 54, 47, 40, 62, 73],
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
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6, lg: 6 }}>
            <AnalyticsBudgetCategories
              title="Monthly Budget Progress"
              subheader="$150 total left"
              chart={{
                categories: ['Gas', 'Restaurants', 'Supermarkets', 'Entertainment', 'Misc.'],
                series: [
                  { name: 'Current', data: [43, 33, 22, 37, 67] },
                  { name: 'Allocated', data: [51, 70, 47, 67, 40] },
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
