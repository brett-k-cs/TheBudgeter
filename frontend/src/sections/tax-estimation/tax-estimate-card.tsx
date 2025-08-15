import type { TaxEstimate } from 'src/utils/tax-calculations';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { TAX_RATES, formatCurrency, formatPercentage } from 'src/utils/tax-calculations';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type TaxEstimateCardProps = {
  estimate: TaxEstimate;
};

export function TaxEstimateCard({ estimate }: TaxEstimateCardProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Tax Estimate Summary
        </Typography>

        <Stack spacing={3}>
          {/* Income Summary */}
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Income Summary
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">W-2 Income (Net Received):</Typography>
                <Label color="info">{formatCurrency(estimate.w2Income)}</Label>
              </Box>
              {estimate.w2GrossIncome > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    • Gross W-2 Income:
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(estimate.w2GrossIncome)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">1099 Income:</Typography>
                <Label color="warning">{formatCurrency(estimate.income1099)}</Label>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2">Total Gross Income:</Typography>
                <Label color="success" variant="filled">
                  {formatCurrency(estimate.totalIncome)}
                </Label>
              </Box>
            </Stack>
          </Box>

          {/* W-2 Withholdings (if applicable) */}
          {estimate.w2TotalWithheld > 0 && (
            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                W-2 Taxes Already Withheld
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    Social Security ({formatPercentage(TAX_RATES.SOCIAL_SECURITY)}):
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(estimate.w2SocialSecurityWithheld)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    Medicare ({formatPercentage(TAX_RATES.MEDICARE)}):
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(estimate.w2MedicareWithheld)}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2">Total Already Paid:</Typography>
                  <Typography variant="subtitle2" color="success.main">
                    {formatCurrency(estimate.w2TotalWithheld)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Tax Breakdown */}
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Tax Breakdown
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  Income Tax (Progressive):
                </Typography>
                <Typography variant="body2" color="error.main">
                  {formatCurrency(estimate.incomeTax)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  Social Security Tax ({formatPercentage(TAX_RATES.SOCIAL_SECURITY)}):
                </Typography>
                <Typography variant="body2" color="error.main">
                  {formatCurrency(estimate.socialSecurityTax)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  Medicare Tax ({formatPercentage(TAX_RATES.MEDICARE)}):
                </Typography>
                <Typography variant="body2" color="error.main">
                  {formatCurrency(estimate.medicareTax)}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2">Self-Employment Tax:</Typography>
                <Typography variant="subtitle2" color="error.main">
                  {formatCurrency(estimate.selfEmploymentTax)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Total Tax Owed */}
          <Box>
            <Divider />
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mt: 2,
                p: 2,
                bgcolor: 'error.lighter',
                borderRadius: 1
              }}
            >
              <Typography variant="h6">Total Estimated Tax Owed:</Typography>
              <Label color="error" variant="filled" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {formatCurrency(estimate.totalTaxOwed)}
              </Label>
            </Box>
          </Box>

          {/* Disclaimer */}
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Disclaimer:</strong> This is a simplified tax estimate for planning purposes only. 
              Actual tax calculations may vary based on deductions, credits, filing status, and other factors. 
              Please consult a tax professional for accurate tax planning. Estimated using {TAX_RATES.year} values.
              This assumes your W-2 employer witholds the correct amount of social security and medicare taxes, but does not withhold any income tax.
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
