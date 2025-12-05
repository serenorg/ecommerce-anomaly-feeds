import { Router, type Request, type Response } from 'express';
import { BackendService } from '../services/backend.js';
import { verifyWebhookSignature } from '../middleware/verify.js';

export interface WebhookPayload {
  shopDomain: string;
  topic: string;
  body: unknown;
}

export async function handleWebhookDelivery(
  backend: BackendService,
  payload: WebhookPayload
) {
  await backend.forwardWebhook(payload);
}

function parseRequestBody(req: Request): unknown {
  if (!req.body) {
    return {};
  }

  if (Buffer.isBuffer(req.body)) {
    const raw = req.body.toString('utf8');
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return req.body;
    }
  }

  return req.body;
}

export function createWebhookRouter() {
  const router = Router();
  const backend = new BackendService();

  router.post('/', verifyWebhookSignature(), async (req: Request, res: Response, next) => {
    try {
      const topic = req.get('X-Shopify-Topic') ?? 'unknown';
      const shopDomain = req.get('X-Shopify-Shop-Domain') ?? 'unknown';

      await handleWebhookDelivery(backend, {
        topic,
        shopDomain,
        body: parseRequestBody(req),
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
