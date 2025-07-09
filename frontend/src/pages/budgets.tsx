import { CONFIG } from 'src/config-global';

import { BudgetsView } from 'src/sections/budgets/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Budgets - ${CONFIG.appName}`}</title>

      <BudgetsView />
    </>
  );
}
