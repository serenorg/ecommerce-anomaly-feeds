import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  registerMerchant,
  updateMerchantSettings,
  getMerchantSettings,
  forwardWebhook,
} from '../src/services/backend.js';

declare const global: typeof globalThis & { fetch?: typeof fetch };

const originalBackendUrl = process.env.BACKEND_URL;
const originalApiKey = process.env.BACKEND_API_KEY;

beforeEach(() => {
  process.env.BACKEND_URL = 'https://toolshed.serenai.com';
  process.env.BACKEND_API_KEY = 'test-key';
});

afterEach(() => {
  if (originalBackendUrl === undefined) {
    delete process.env.BACKEND_URL;
  } else {
    process.env.BACKEND_URL = originalBackendUrl;
  }

  if (originalApiKey === undefined) {
    delete process.env.BACKEND_API_KEY;
  } else {
    process.env.BACKEND_API_KEY = originalApiKey;
  }
});

describe('registerMerchant', () => {
  it('posts merchant payload to backend', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(''),
    });

    await registerMerchant(
      {
        shopId: 'test-store.myshopify.com',
        platform: 'shopify',
        email: 'merchant@example.com',
      },
      mockFetch
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://toolshed.serenai.com/api/merchants/register',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('test-store.myshopify.com'),
      })
    );
  });
});

describe('updateMerchantSettings', () => {
  it('patches merchant settings', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(''),
    });

    await updateMerchantSettings(
      {
        shopId: 'test-store.myshopify.com',
        email: 'merchant@example.com',
        webhookUrl: 'https://hooks.slack.com/xxx',
      },
      mockFetch
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://toolshed.serenai.com/api/merchants/settings',
      expect.objectContaining({
        method: 'PATCH',
      })
    );
  });
});

describe('getMerchantSettings', () => {
  it('returns settings JSON', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ email: 'merchant@example.com' }),
      status: 200,
    });

    const result = await getMerchantSettings('test-store.myshopify.com', mockFetch);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://toolshed.serenai.com/api/merchants/settings?shop_id=test-store.myshopify.com',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      })
    );
    expect(result).toEqual({ email: 'merchant@example.com' });
  });

  it('returns null on 404', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve(''),
    });

    await expect(getMerchantSettings('missing-shop', mockFetch)).resolves.toBeNull();
  });
});

describe('forwardWebhook', () => {
  it('posts mapped event to charms endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(''),
    });

    await forwardWebhook(
      {
        shopDomain: 'shop.myshopify.com',
        topic: 'orders/paid',
        body: {
          total_price: '99.99',
          financial_status: 'paid',
          created_at: '2025-12-04T00:00:00Z',
        },
      },
      mockFetch
    );

    const [url, options] = mockFetch.mock.calls[0] ?? [];
    expect(url).toBe('https://toolshed.serenai.com/events');
    expect(options?.method).toBe('POST');
    const parsedBody = JSON.parse(options?.body as string);
    expect(parsedBody).toMatchObject({
      shop_id: 'shop.myshopify.com',
      source_platform: 'shopify',
      event_type: 'order_created',
      financial_status: 'paid',
      order_total: 99.99,
      timestamp: '2025-12-04T00:00:00Z',
    });
  });

  it('maps cancelled orders to failed events', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(''),
    });

    await forwardWebhook(
      {
        shopDomain: 'shop.myshopify.com',
        topic: 'orders/cancelled',
        body: { total_price: '10.00' },
      },
      mockFetch
    );

    const [, requestInit] = mockFetch.mock.lastCall ?? [];
    expect(requestInit?.body).toContain('order_failed');
    expect(requestInit?.body).toContain('failed');
  });
});
