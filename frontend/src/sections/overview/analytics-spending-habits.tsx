import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fNumber } from 'src/utils/format-number';
import { handleRequest } from 'src/utils/handle-request';

import { categories } from 'src/_mock/_categories';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart, ChartLegends } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  chart: {
    colors?: string[];
    series: {
      label: string;
      value: number;
    }[];
    options?: ChartOptions;
  };
  onDateRangeChange?: (startDate: string, endDate: string) => void;
};

interface DrillDownData {
  category: string;
  series: {
    label: string;
    value: number;
  }[];
  details: {
    description: string;
    total: number;
    count: number;
    transactions: any[];
  }[];
}

export function AnalyticsSpendingHabits({ title, subheader, chart, onDateRangeChange, sx, ...other }: Props) {
  const theme = useTheme();
  const [isDrillDown, setIsDrillDown] = useState(false);
  const [drillDownCategory, setDrillDownCategory] = useState('');
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [dateRange, setDateRange] = useState<[string, string]>([startDate, endDate]);

  const currentChart = drillDownData || chart;
  const chartSeries = currentChart.series.map((item) => item.value);

  const chartColors = chart.colors ?? [
    theme.palette.primary.main,
    theme.palette.warning.light,
    theme.palette.info.dark,
    theme.palette.error.main,
    theme.palette.success.main,
    theme.palette.secondary.main,
    theme.palette.info.light,
    theme.palette.warning.dark,
  ];

  const handleSliceClick = async (event: any, chartContext: any, config: any) => {
    if (isDrillDown) return; // Already in drill-down mode
    setIsDrillDown(true);
    
    const clickedIndex = config.dataPointIndex;
    const clickedCategory = chart.series[clickedIndex]?.label;
    const clickedCategoryID = categories.find(cat => cat.label === clickedCategory)?.id;

    if (!clickedCategoryID) return;

    try {
      const response = await handleRequest(
        `/api/dashboard/categoryTransactions?category=${encodeURIComponent(clickedCategoryID)}&startDate=${startDate}&endDate=${endDate}`,
        'GET',
        undefined,
        true
      );

      if (response?.success) {
        setDrillDownCategory(clickedCategory);
        setDrillDownData({
          category: categories.find(a => a.id == response.data.category)?.label || clickedCategory,
          series: response.data.labels.map((label: string, index: number) => ({
            label,
            value: response.data.values[index],
          })),
          details: response.data.details,
        });
      }
    } catch (error) {
      console.error('Error fetching category transactions:', error);
    }
  };

  const chartOptions = useChart({
    chart: { 
      sparkline: { enabled: true },
      events: {
        dataPointSelection: handleSliceClick,
      },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    colors: chartColors,
    labels: currentChart.series.map((item) => item.label),
    stroke: { width: 0 },
    dataLabels: { enabled: true, dropShadow: { enabled: false } },
    tooltip: {
      y: {
        formatter: (value: number) => `$${fNumber(value)}`,
        title: { formatter: (seriesName: string) => `${seriesName}:` },
      },
    },
    plotOptions: { 
      pie: { 
        donut: { labels: { show: false } },
        expandOnClick: !drillDownData, // Only expand on click if not in drill-down mode
      } 
    },
    ...chart.options,
  });

  const handleBackClick = () => {
    setIsDrillDown(false);
    setDrillDownData(null);
  };

  const handleDateRangeApply = () => {
    onDateRangeChange?.(startDate, endDate);
    setShowDatePicker(false);
    setDateRange([startDate, endDate]);
  };

  const getCurrentTitle = () => {
    if (drillDownData) {
      return `${drillDownData.category} Transactions`;
    }
    return title;
  };

  useEffect(() => {
    if (!isDrillDown)
      return;
    
    try {
      const clickedCategoryID = categories.find(cat => cat.label === drillDownCategory)?.id;
      if (!clickedCategoryID) return;

      handleRequest(
        `/api/dashboard/categoryTransactions?category=${encodeURIComponent(clickedCategoryID)}&startDate=${dateRange[0]}&endDate=${dateRange[1]}`,
        'GET',
        undefined,
        true
      ).then(response => {

        if (response?.success) {
          setDrillDownData((prev) => ({
            category: prev!.category,
            series: response.data.labels.map((label: string, index: number) => ({
              label,
              value: response.data.values[index],
            })),
            details: response.data.details,
          }));
        }
      });
    } catch (error) {
      console.error('Error fetching category transactions:', error);
    }

  }, [dateRange, isDrillDown, drillDownCategory]);

  return (
    <Card sx={sx} {...other}>
      <CardHeader 
        title={getCurrentTitle()}
        subheader={subheader}
        action={
          <Stack direction="row" spacing={1}>
            {drillDownData && (
              <IconButton onClick={handleBackClick} size="small">
                <Iconify icon="eva:arrow-back-fill" />
              </IconButton>
            )}
            <IconButton 
              onClick={() => setShowDatePicker(!showDatePicker)} 
              size="small"
            >
              <Iconify icon="eva:calendar-fill" />
            </IconButton>
          </Stack>
        }
      />

      <Collapse in={showDatePicker}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" size="small" onClick={handleDateRangeApply}>
              Apply
            </Button>
          </Stack>
        </Box>
      </Collapse>

      { chartSeries.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1" color="text.secondary">
            No spending data available for the selected period.
          </Typography>
        </Box>
      ) : null }
      <Chart
        key={drillDownData ? 'drilldown' : 'main'} // Force re-render with animation
        type="pie"
        series={chartSeries}
        options={chartOptions}
        sx={{
          my: 6,
          mx: 'auto',
          width: { xs: 240, xl: 260 },
          height: { xs: 240, xl: 260 },
        }}
      />

      <Divider sx={{ borderStyle: 'dashed' }} />

      <ChartLegends
        labels={chartOptions?.labels}
        colors={chartOptions?.colors}
        sx={{ p: 3, justifyContent: 'center' }}
      />

      {drillDownData && (
        <Box sx={{ p: 2, pt: 0 }}>
          <Typography variant="subtitle2" gutterBottom>
            Transaction Details:
          </Typography>
          {drillDownData.details.map((detail, index) => (
            <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'background.neutral', borderRadius: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">{detail.description}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {detail.count} transaction{detail.count > 1 ? 's' : ''}
                  </Typography>
                  <Typography variant="subtitle2" color="error.main">
                    ${fNumber(detail.total)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Box>
      )}
    </Card>
  );
}