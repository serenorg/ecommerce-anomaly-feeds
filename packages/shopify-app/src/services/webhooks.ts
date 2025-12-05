import { LATEST_API_VERSION, type Session } from '@shopify/shopify-api';

const WEBHOOK_PATH = '/events';

export const REQUIRED_WEBHOOKS = [
  'checkouts/create',
  'orders/create',
  'orders/paid',
  'orders/cancelled',
] as const;

type RegisterWebhookParams = {
  session: Session;
  topic: (typeof REQUIRED_WEBHOOKS)[number];
  address: string;
};

type RegisterWebhookFn = (params: RegisterWebhookParams) => Promise<unknown>;

export async function registerWebhooks(
  session: Session,
  registerFn: RegisterWebhookFn = registerShopifyWebhook
) {
  const address = buildWebhookAddress();

  await Promise.all(
    REQUIRED_WEBHOOKS.map((topic) =>
      registerFn({
        session,
        topic,
        address,
      })
    )
  );
}

function buildWebhookAddress(path = WEBHOOK_PATH): string {
  const baseUrl = process.env.CHARMS_SERVICE_URL ?? process.env.BACKEND_URL ?? process.env.HOST;
  if (!baseUrl) {
    throw new Error('CHARMS_SERVICE_URL, BACKEND_URL, or HOST must be configured to register webhooks');
  }

  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function registerShopifyWebhook({ session, topic, address }: RegisterWebhookParams) {
  if (!session.accessToken) {
    throw new Error('Shopify session missing access token');
  }

  const response = await fetch(
    `https://${session.shop}/admin/api/${LATEST_API_VERSION}/webhooks.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': session.accessToken,
      },
      body: JSON.stringify({
        webhook: {
          topic,
          address,
          format: 'json',
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to register webhook for ${topic}: ${errorText}`);
  }
}
