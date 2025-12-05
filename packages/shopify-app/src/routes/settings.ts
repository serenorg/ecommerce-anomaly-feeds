import { Router } from 'express';
import { BackendService } from '../services/backend.js';

export interface SettingsPayload {
  shopId: string;
  email: string;
  webhookUrl?: string;
}

export async function handleSettingsUpdate(
  backend: BackendService,
  payload: SettingsPayload
) {
  if (!payload.shopId) {
    throw new Error('shopId is required');
  }

  if (!payload.email) {
    throw new Error('email is required');
  }

  return backend.saveSettings(payload);
}

export async function handleSettingsFetch(backend: BackendService, shopId?: string) {
  if (!shopId) {
    throw new Error('shopId is required');
  }

  return backend.getSettings(shopId);
}

export function createSettingsRouter() {
  const router = Router();
  const backend = new BackendService();

  router.get('/', async (req, res, next) => {
    try {
      const shopId = typeof req.query.shopId === 'string' ? req.query.shopId : undefined;
      const settings = await handleSettingsFetch(backend, shopId);
      res.status(200).json(settings ?? {});
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      await handleSettingsUpdate(backend, req.body as SettingsPayload);
      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
