import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

export var plaidClient: PlaidApi | null = null;

export const initializePlaidClient = () => {
  if (plaidClient) {
    console.warn('Plaid client is already initialized.');
    return;
  }

  if (!['1', 'Y', 'TRUE'].includes((process.env.USE_PLAID || '').toUpperCase())) {
    console.warn('Plaid integration is disabled. Set USE_PLAID=1 in your .env file to enable.');
    return;
  }

  const CLIENT_ID = process.env.PLAID_CLIENT_ID || '';
  const SECRET = process.env.PLAID_SECRET || '';
  const ENVIRONMENT = process.env.PLAID_ENVIRONMENT || 'sandbox';

  const configuration = new Configuration({
    basePath: PlaidEnvironments[ENVIRONMENT],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': CLIENT_ID,
        'PLAID-SECRET': SECRET,
        'Plaid-Version': '2020-09-14',
      },
    },
  });

  console.log(`Initializing Plaid client in ${ENVIRONMENT} mode...`);

  plaidClient = new PlaidApi(configuration);
  console.log('Plaid client initialized successfully.');
};