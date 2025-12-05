export type Platform = 'shopify' | 'woocommerce';

type FetchFn = typeof fetch;

type MerchantRegistration = {
  shopId: string;
  platform: Platform;
  email?: string;
  webhookUrl?: string;
};

type MerchantSettingsPayload = {
  shopId: string;
  email: string;
  webhookUrl?: string;
};

type WebhookForwardPayload = {
  shopDomain: string;
  topic: string;
  body: unknown;
};

type FinancialStatus = 'pending' | 'paid' | 'failed';

type CharmsEventType = 'checkout_started' | 'order_created' | 'order_failed';

type CharmsEvent = {
  shop_id: string;
  source_platform: Platform;
  event_type: CharmsEventType;
  financial_status: FinancialStatus;
  order_total: number;
  timestamp: string;
  raw_payload: unknown;
};

type RequestInitExtra = Omit<RequestInit, 'body'> & { body?: unknown };

function ensureBaseUrl(baseUrl = process.env.BACKEND_URL): string {
  if (!baseUrl) {
    throw new Error('BACKEND_URL must be configured');
  }

  return baseUrl.replace(/\/$/, '');
}

function buildHeaders(apiKey = process.env.BACKEND_API_KEY) {
  return {
    'Content-Type': 'application/json',
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  } satisfies Record<string, string>;
}

function resolveFetch(fetchFn?: FetchFn): FetchFn {
  const runtimeFetch = fetchFn ?? globalThis.fetch;
  if (!runtimeFetch) {
    throw new Error('Fetch API is not available in this environment');
  }

  return runtimeFetch;
}

async function requestBackend(
  path: string,
  { method = 'GET', body, fetchFn }: RequestInitExtra & { fetchFn?: FetchFn }
) {
  const baseUrl = ensureBaseUrl();
  const url = `${baseUrl}${path}`;
  const runtimeFetch = resolveFetch(fetchFn);

  const response = await runtimeFetch(url, {
    method,
    headers: buildHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }

    const errorText = await response.text();
    throw new Error(`Backend request failed: ${response.status} ${errorText}`);
  }

  return response
    .text()
    .then((text) => (text ? JSON.parse(text) : undefined))
    .catch(() => undefined);
}

export async function registerMerchant(
  payload: MerchantRegistration,
  fetchFn?: FetchFn
) {
  return requestBackend('/api/merchants/register', {
    method: 'POST',
    body: {
      shop_id: payload.shopId,
      platform: payload.platform,
      email: payload.email,
      webhook_url: payload.webhookUrl,
    },
    fetchFn,
  });
}

export async function updateMerchantSettings(
  payload: MerchantSettingsPayload,
  fetchFn?: FetchFn
) {
  return requestBackend('/api/merchants/settings', {
    method: 'PATCH',
    body: {
      shop_id: payload.shopId,
      email: payload.email,
      webhook_url: payload.webhookUrl,
    },
    fetchFn,
  });
}

export async function getMerchantSettings(shopId: string, fetchFn?: FetchFn) {
  const baseUrl = ensureBaseUrl();
  const url = `${baseUrl}/api/merchants/settings?shop_id=${encodeURIComponent(shopId)}`;
  const runtimeFetch = resolveFetch(fetchFn);

  const response = await runtimeFetch(url, {
    headers: buildHeaders(),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function forwardWebhook(payload: WebhookForwardPayload, fetchFn?: FetchFn) {
  const event = buildCharmsEvent(payload);
  return requestBackend('/events', {
    method: 'POST',
    body: event,
    fetchFn,
  });
}

function buildCharmsEvent(payload: WebhookForwardPayload): CharmsEvent {
  const body = toRecord(payload.body);
  const topic = payload.topic.toLowerCase();
  const financial_status = normalizeFinancialStatus(topic, body?.financial_status);
  const event_type = resolveEventType(topic);
  const order_total = parseAmount(body?.total_price ?? body?.subtotal_price ?? body?.current_total_price ?? body?.total_line_items_price);
  const timestamp = extractTimestamp(body);

  return {
    shop_id: payload.shopDomain,
    source_platform: 'shopify',
    event_type,
    financial_status,
    order_total: order_total ?? 0,
    timestamp,
    raw_payload: payload.body,
  };
}

function toRecord(value: unknown): Record<string, any> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  return null;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function extractTimestamp(body: Record<string, any> | null): string {
  const candidate = body?.processed_at || body?.created_at || body?.updated_at;
  if (typeof candidate === 'string') {
    return candidate;
  }

  return new Date().toISOString();
}

function normalizeFinancialStatus(topic: string, status: unknown): FinancialStatus {
  const normalizedTopic = topic.toLowerCase();
  if (normalizedTopic === 'checkouts/create') {
    return 'pending';
  }

  if (normalizedTopic === 'orders/paid') {
    return 'paid';
  }

  if (normalizedTopic === 'orders/cancelled') {
    return 'failed';
  }

  if (typeof status !== 'string') {
    return 'pending';
  }

  const lower = status.toLowerCase();

  if (lower === 'paid') {
    return 'paid';
  }

  if (['voided', 'refunded', 'partially_refunded', 'cancelled'].includes(lower)) {
    return 'failed';
  }

  return 'pending';
}

function resolveEventType(topic: string): CharmsEventType {
  const normalized = topic.toLowerCase();
  if (normalized === 'checkouts/create') {
    return 'checkout_started';
  }
  if (normalized === 'orders/cancelled') {
    return 'order_failed';
  }

  return 'order_created';
}

export class BackendService {
  constructor(
    private readonly fetchFn?: FetchFn,
    private readonly platform: Platform = 'shopify'
  ) {}

  registerMerchant(payload: Omit<MerchantRegistration, 'platform'> & { platform?: Platform }) {
    return registerMerchant({ ...payload, platform: payload.platform ?? this.platform }, this.fetchFn);
  }

  saveSettings(payload: MerchantSettingsPayload) {
    return updateMerchantSettings(payload, this.fetchFn);
  }

  getSettings(shopId: string) {
    return getMerchantSettings(shopId, this.fetchFn);
  }

  forwardWebhook(payload: WebhookForwardPayload) {
    return forwardWebhook(payload, this.fetchFn);
  }
}
