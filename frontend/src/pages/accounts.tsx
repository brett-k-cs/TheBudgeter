import { CONFIG } from 'src/config-global';

import { AccountsView } from 'src/sections/accounts/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Accounts - ${CONFIG.appName}`}</title>

      <AccountsView />
    </>
  );
}
