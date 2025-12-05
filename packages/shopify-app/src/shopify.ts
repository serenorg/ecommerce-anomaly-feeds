import { shopifyApp, LATEST_API_VERSION, type Session } from '@shopify/shopify-api';

type ShopifyAuth = {
  begin: (options: Record<string, unknown>) => Promise<unknown>;
  callback: (options: Record<string, unknown>) => Promise<{ session: Session }>;
};

type ShopifyWebhookManager = {
  register: (options: Record<string, unknown>) => Promise<unknown>;
};

export interface ShopifyAdapter {
  auth: ShopifyAuth;
  webhooks: ShopifyWebhookManager;
}

function sanitizeHost(host?: string): string {
  if (!host) {
    return 'localhost';
  }
  return host.replace(/^https?:\/\//i, '');
}

export function configureShopify(): ShopifyAdapter {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  const host = sanitizeHost(process.env.HOST);
  const scopes = process.env.SCOPES ?? 'read_orders,read_checkouts';

  if (!apiKey || !apiSecret) {
    throw new Error('Missing Shopify API credentials');
  }

  const app = shopifyApp({
    api: {
      apiVersion: LATEST_API_VERSION,
      apiKey,
      apiSecretKey: apiSecret,
      hostName: host,
      scopes: scopes.split(',').map((scope) => scope.trim()),
    },
    auth: {
      path: '/auth',
      callbackPath: '/auth/callback',
    },
    webhooks: {
      path: '/api/webhooks/shopify',
    },
  });

  return app as ShopifyAdapter;
}

export type { Session };
