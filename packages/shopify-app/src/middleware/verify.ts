import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export function verifyShopifyHmac(payload: string, hmacHeader: string | undefined, secret: string): boolean {
  if (!payload || !hmacHeader || !secret) {
    return false;
  }

  const computed = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');

  const receivedBuffer = Buffer.from(hmacHeader, 'base64');
  const computedBuffer = Buffer.from(computed, 'base64');

  if (receivedBuffer.length !== computedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, computedBuffer);
}

function extractRawBody(body: unknown): string {
  if (!body) {
    return '';
  }

  if (Buffer.isBuffer(body)) {
    return body.toString('utf8');
  }

  if (typeof body === 'string') {
    return body;
  }

  return JSON.stringify(body);
}

export function verifyWebhookSignature(secret = process.env.WEBHOOK_SECRET ?? '') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!secret) {
      return res.status(500).json({ error: 'WEBHOOK_SECRET is not configured' });
    }

    const received = req.get('X-Shopify-Hmac-Sha256');
    const rawBody = extractRawBody(req.body);

    if (!verifyShopifyHmac(rawBody, received, secret)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    return next();
  };
}
