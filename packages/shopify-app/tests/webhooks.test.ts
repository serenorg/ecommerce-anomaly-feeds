import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@shopify/shopify-api';
import type { BackendService } from '../src/services/backend.js';
import { handleWebhookDelivery } from '../src/routes/webhooks.js';
import { registerWebhooks, REQUIRED_WEBHOOKS } from '../src/services/webhooks.js';

const baseSession = {
  shop: 'test-shop.myshopify.com',
  accessToken: 'test-token',
} as unknown as Session;

const originalBackendUrl = process.env.BACKEND_URL;
const originalHost = process.env.HOST;
const originalCharmsUrl = process.env.CHARMS_SERVICE_URL;

describe('registerWebhooks', () => {
  beforeEach(() => {
    process.env.CHARMS_SERVICE_URL = 'https://charms.serenai.com';
  });

  afterEach(() => {
    if (originalBackendUrl === undefined) {
      delete process.env.BACKEND_URL;
    } else {
      process.env.BACKEND_URL = originalBackendUrl;
    }

    if (originalHost === undefined) {
      delete process.env.HOST;
    } else {
      process.env.HOST = originalHost;
    }

    if (originalCharmsUrl === undefined) {
      delete process.env.CHARMS_SERVICE_URL;
    } else {
      process.env.CHARMS_SERVICE_URL = originalCharmsUrl;
    }
  });

  it('registers all required topics', async () => {
    const registerFn = vi.fn().mockResolvedValue({});

    await registerWebhooks(baseSession, registerFn);

    expect(registerFn).toHaveBeenCalledTimes(REQUIRED_WEBHOOKS.length);
    REQUIRED_WEBHOOKS.forEach((topic) => {
      expect(registerFn).toHaveBeenCalledWith(
        expect.objectContaining({
          topic,
          address: expect.stringContaining('/events'),
        })
      );
    });
  });

  it('points registrations to backend URL', async () => {
    const registerFn = vi.fn().mockResolvedValue({});

    await registerWebhooks(baseSession, registerFn);

      expect(registerFn).toHaveBeenCalledWith(
        expect.objectContaining({
          address: 'https://charms.serenai.com/events',
        })
      );
  });
});

describe('handleWebhookDelivery', () => {
  it('forwards payload to backend', async () => {
    const backend = {
      forwardWebhook: vi.fn().mockResolvedValue({ ok: true }),
    } as unknown as BackendService;

    await handleWebhookDelivery(backend, {
      shopDomain: 'shop.myshopify.com',
      topic: 'orders/create',
      body: { id: 1 },
    });

    expect(backend.forwardWebhook).toHaveBeenCalledWith({
      shopDomain: 'shop.myshopify.com',
      topic: 'orders/create',
      body: { id: 1 },
    });
  });
});
