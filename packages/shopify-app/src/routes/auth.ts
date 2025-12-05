import { Router, type Request, type Response } from 'express';
import type { ShopifyAdapter } from '../shopify.js';
import { BackendService } from '../services/backend.js';
import { registerWebhooks } from '../services/webhooks.js';
import { fetchShopDetails } from '../services/shop.js';

export interface AuthCallbackPayload {
  shop: string;
  email?: string;
  webhookUrl?: string;
  rawRequest?: Request;
  rawResponse?: Response;
}

export async function handleAuthCallback(
  shopify: ShopifyAdapter,
  backend: BackendService,
  payload: AuthCallbackPayload
) {
  const result = await shopify.auth.callback({
    rawRequest: payload.rawRequest,
    rawResponse: payload.rawResponse,
  });

  await registerWebhooks(result.session);

  const merchantEmail = payload.email ?? (await fetchShopDetails(result.session)).email;

  await backend.registerMerchant({
    shopId: result.session.shop,
    platform: 'shopify',
    email: merchantEmail,
    webhookUrl: payload.webhookUrl,
  });

  return result;
}

export function createAuthRouter(shopify: ShopifyAdapter) {
  const router = Router();
  const backend = new BackendService();

  router.get('/', async (req, res, next) => {
    try {
      const shop = typeof req.query.shop === 'string' ? req.query.shop : undefined;
      if (!shop) {
        return res.status(400).json({ error: 'Missing shop query param' });
      }

      await shopify.auth.begin({
        shop,
        callbackPath: '/auth/callback',
        isOnline: false,
        rawRequest: req,
        rawResponse: res,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/callback', async (req, res, next) => {
    try {
      const { shop, email, webhookUrl } = req.query;
      const normalizedShop = typeof shop === 'string' ? shop : '';

      await handleAuthCallback(shopify, backend, {
        shop: normalizedShop,
        email: typeof email === 'string' ? email : undefined,
        webhookUrl: typeof webhookUrl === 'string' ? webhookUrl : undefined,
        rawRequest: req,
        rawResponse: res,
      });

      res.redirect(`https://${normalizedShop}/admin/apps`);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
