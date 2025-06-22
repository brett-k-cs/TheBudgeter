import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { _posts, _tasks, _traffic, _timeline } from 'src/_mock';

import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsSpendingHabits } from '../analytics-spending-habits';
import { AnalyticsBudgetCategories } from '../analytics-budget-categories';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Monthly Income"
            percent={2.6}
            total={302}
            icon={<img alt="Monthly Income" src="/assets/icons/glass/ic-glass-bag.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [22, 8, 35, 50, 82, 84, 77, 12],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Monthly Spending"
            percent={-0.1}
            total={24}
            color="warning"
            icon={<img alt="Monthly Spending" src="/assets/icons/glass/ic-glass-buy.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [56, 47, 40, 62, 73, 30, 23, 54],
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

        <Grid container spacing={2} alignItems="stretch" size={{xs: 12, md: 12, lg: 12}}>
          <Grid size={{ xs: 12, md: 6, lg: 6 }}>
            <AnalyticsSpendingHabits
              title="Monthly Spending"
              chart={{
                series: [
                  { label: 'Gas', value: 43 },
                  { label: 'Restaurants', value: 30 },
                  { label: 'Supermarkets', value: 10 },
                  { label: 'Gifts', value: 15 },
                  { label: 'Entertainment', value: 30 },
                ],
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
              style={{ height: "100%" }}
            />
          </Grid>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
