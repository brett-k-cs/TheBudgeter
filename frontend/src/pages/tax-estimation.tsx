import { CONFIG } from 'src/config-global';

import { TaxEstimationView } from 'src/sections/tax-estimation/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Tax Estimation - ${CONFIG.appName}`}</title>

      <TaxEstimationView />
    </>
  );
}
