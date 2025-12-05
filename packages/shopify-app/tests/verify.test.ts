import { describe, expect, it } from 'vitest';
import crypto from 'crypto';
import { verifyShopifyHmac } from '../src/middleware/verify.js';

describe('verifyShopifyHmac', () => {
  const secret = 'test-secret';
  const payload = JSON.stringify({ id: 1 });
  const validHmac = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');

  it('returns true for valid signature', () => {
    expect(verifyShopifyHmac(payload, validHmac, secret)).toBe(true);
  });

  it('returns false for invalid signature', () => {
    expect(verifyShopifyHmac(payload, 'invalid', secret)).toBe(false);
  });

  it('returns false when secret missing', () => {
    expect(verifyShopifyHmac(payload, validHmac, '')).toBe(false);
  });
});
