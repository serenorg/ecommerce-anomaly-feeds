import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

const { authBeginMock, authCallbackMock, webhookRegisterMock } = vi.hoisted(() => ({
  authBeginMock: vi.fn(),
  authCallbackMock: vi.fn(),
  webhookRegisterMock: vi.fn(),
}));

vi.mock('../../src/shopify.js', () => ({
  configureShopify: () => ({
    auth: {
      begin: authBeginMock,
      callback: authCallbackMock,
    },
    webhooks: {
      register: webhookRegisterMock,
    },
  }),
}));

import { app } from '../../src/index.js';

describe('Integration: OAuth install flow', () => {
  beforeEach(() => {
    authBeginMock.mockImplementation(async ({ rawResponse }) => {
      rawResponse.redirect('https://test-shop.myshopify.com/admin/oauth/authorize');
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('redirects merchants to Shopify OAuth screen', async () => {
    const response = await request(app).get('/auth?shop=test-shop.myshopify.com');

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('test-shop.myshopify.com');
    expect(authBeginMock).toHaveBeenCalledWith(
      expect.objectContaining({ shop: 'test-shop.myshopify.com' })
    );
  });
});

describe('Integration: settings API proxy', () => {
  const originalBackendUrl = process.env.BACKEND_URL;
  const originalBackendKey = process.env.BACKEND_API_KEY;
  const originalFetch = global.fetch;

  beforeAll(() => {
    process.env.BACKEND_URL = 'https://mock.serenai.com';
    process.env.BACKEND_API_KEY = 'integration-key';
  });

  afterAll(() => {
    if (originalBackendUrl === undefined) {
      delete process.env.BACKEND_URL;
    } else {
      process.env.BACKEND_URL = originalBackendUrl;
    }

    if (originalBackendKey === undefined) {
      delete process.env.BACKEND_API_KEY;
    } else {
      process.env.BACKEND_API_KEY = originalBackendKey;
    }
  });

  it('returns settings from backend service', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ email: 'merchant@example.com', webhookUrl: '' }),
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await request(app).get('/api/settings?shopId=test-shop.myshopify.com');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ email: 'merchant@example.com' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://mock.serenai.com/api/merchants/settings?shop_id=test-shop.myshopify.com',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer integration-key' }),
      })
    );
  });

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (global as typeof globalThis).fetch;
    }
  });
});
