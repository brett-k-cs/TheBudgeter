import { CONFIG } from 'src/config-global';

import { TransactionsView } from 'src/sections/transactions/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Transactions - ${CONFIG.appName}`}</title>

      <TransactionsView />
    </>
  );
}
