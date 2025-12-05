import { LATEST_API_VERSION, type Session } from '@shopify/shopify-api';

type FetchFn = typeof fetch;

export interface ShopDetails {
  email: string;
}

export async function fetchShopDetails(session: Session, fetchFn?: FetchFn): Promise<ShopDetails> {
  if (!session.accessToken) {
    throw new Error('Shopify session missing access token');
  }

  const runtimeFetch = fetchFn ?? globalThis.fetch;
  if (!runtimeFetch) {
    throw new Error('Fetch API is not available in this environment');
  }

  const response = await runtimeFetch(
    `https://${session.shop}/admin/api/${LATEST_API_VERSION}/shop.json`,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': session.accessToken,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to load shop info: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as { shop?: { email?: string } };
  const email = data.shop?.email;
  if (!email) {
    throw new Error('Shop email is missing from Shopify response');
  }

  return { email };
}
