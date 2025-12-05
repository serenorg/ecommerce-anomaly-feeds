import { describe, expect, it, vi } from 'vitest';
import type { BackendService } from '../src/services/backend.js';
import type { ShopifyAdapter } from '../src/shopify.js';

const { registerWebhooksMock, fetchShopDetailsMock } = vi.hoisted(() => ({
  registerWebhooksMock: vi.fn(),
  fetchShopDetailsMock: vi.fn().mockResolvedValue({ email: 'owner@shop.com' }),
}));

vi.mock('../src/services/webhooks.js', () => ({
  registerWebhooks: registerWebhooksMock,
}));

vi.mock('../src/services/shop.js', () => ({
  fetchShopDetails: fetchShopDetailsMock,
}));

import { handleAuthCallback } from '../src/routes/auth.js';

function buildShopifyMock() {
  return {
    auth: {
      callback: vi.fn().mockResolvedValue({
        session: {
          shop: 'test-shop.myshopify.com',
        },
      }),
    },
    webhooks: {
      register: vi.fn(),
    },
  } as unknown as ShopifyAdapter;
}

describe('handleAuthCallback', () => {
  it('registers merchant when email provided', async () => {
    const backend = {
      registerMerchant: vi.fn().mockResolvedValue({ ok: true }),
    } as unknown as BackendService;
    const shopify = buildShopifyMock();

    await handleAuthCallback(shopify, backend, {
      shop: 'test-shop.myshopify.com',
      email: 'merchant@example.com',
      webhookUrl: 'https://hooks.slack.com/123',
    });

    expect(backend.registerMerchant).toHaveBeenCalledWith({
      shopId: 'test-shop.myshopify.com',
      platform: 'shopify',
      email: 'merchant@example.com',
      webhookUrl: 'https://hooks.slack.com/123',
    });
    expect(registerWebhooksMock).toHaveBeenCalled();
    expect(fetchShopDetailsMock).not.toHaveBeenCalled();
  });

  it('fetches shop email when not provided in payload', async () => {
    const backend = {
      registerMerchant: vi.fn(),
    } as unknown as BackendService;
    const shopify = buildShopifyMock();

    await handleAuthCallback(shopify, backend, {
      shop: 'test-shop.myshopify.com',
    });

    expect(fetchShopDetailsMock).toHaveBeenCalled();
    expect(backend.registerMerchant).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@shop.com',
      })
    );
  });
});
