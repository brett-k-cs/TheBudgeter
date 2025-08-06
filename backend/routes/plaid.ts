import { Request, Response, Router } from "express";
import { CountryCode, Products } from "plaid";
import crypto from "crypto";

import { PlaidItem } from "../models/plaidItem.js";
import { plaidClient } from "../plaid-manager.js";
import { User } from "../models/user.js";

const router = Router();

router.post('/create_link_token', async (req : Request, res : Response) => {
  if (!plaidClient) {
    res.status(500).json({ error: 'Plaid client not initialized' });
    return;
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: `${req.user!.id}-Budgeter` },
      client_name: 'TheBudgeter',
      products: [Products.Transactions],
      required_if_supported_products: [Products.Auth],
      // redirect_uri: `${process.env.FRONTEND_URL}/`,
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    res.json({ success: true, data: { link_token: response.data.link_token } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

router.post('/exchange_public_token', async (req : Request, res : Response) => {
  const { public_token } = req.body;

  if (!plaidClient) {
    res.status(500).json({ error: 'Plaid client not initialized' });
    return;
  }

  try {
    const tokenResponse = await plaidClient.itemPublicTokenExchange({ public_token });

    const access_token = tokenResponse.data.access_token;
    const item_id = tokenResponse.data.item_id;

    const user = await User.findByPk(req.user!.id);
    if (user) {
      const accessTokenSecret = process.env.PLAID_ACCESS_TOKEN_SECRET || '';
      const algorithm = 'aes-256-ctr';
      const iv = crypto.randomBytes(16);
      
      // Encrypt the access token
      const cipher = crypto.createCipheriv(
        algorithm, 
        Buffer.from(accessTokenSecret.padEnd(32).slice(0, 32)), 
        iv
      );
      let encryptedToken = cipher.update(access_token, 'utf8', 'hex');
      encryptedToken += cipher.final('hex');
      const encodedAccessToken = iv.toString('hex') + ':' + encryptedToken;

      await PlaidItem.create({
        userId: user.id,
        accessToken: encodedAccessToken,
        itemId: item_id,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

router.get('/balance', async (req, res) => {
  const user = await User.findByPk(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const plaidItems = await PlaidItem.findAll({
    where: { userId: user.id },
    attributes: ['accessToken'],
  });

  if (!plaidItems || plaidItems.length === 0) {
    res.status(400).json({ error: 'No linked accounts' });
    return;
  }

  if (!plaidClient) {
    res.status(500).json({ error: 'Plaid client not initialized' });
    return;
  }

  const balances = [];
  for (const item of plaidItems) {
    // Decrypt the access token and fetch balances
    const accessTokenSecret = process.env.PLAID_ACCESS_TOKEN_SECRET || '';
    const parts = item.accessToken.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(
      'aes-256-ctr',
      Buffer.from(accessTokenSecret.padEnd(32).slice(0, 32)),
      iv
    );
    let decryptedToken = decipher.update(encryptedText, 'hex', 'utf8');
    decryptedToken += decipher.final('utf8');
    
    try {
      const balanceResponse = await plaidClient.accountsBalanceGet({
        access_token: decryptedToken,
      });

      balances.push(...balanceResponse.data.accounts);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch balances' });
      return;
    }
  }

  if (balances.length === 0) { // should never trigger but just in case
    res.status(404).json({ error: 'No balances found' });
    return;
  }

  // Return the balances
  res.json({ success: true, data: balances });
});

export { router as plaidRouter };