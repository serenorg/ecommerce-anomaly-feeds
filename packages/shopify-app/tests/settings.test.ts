import { describe, expect, it, vi } from 'vitest';
import type { BackendService } from '../src/services/backend.js';
import { handleSettingsUpdate, handleSettingsFetch } from '../src/routes/settings.js';

describe('handleSettingsUpdate', () => {
  it('passes payload to backend', async () => {
    const backend = {
      saveSettings: vi.fn().mockResolvedValue({ ok: true }),
    } as unknown as BackendService;

    const payload = { shopId: 'demo', email: 'test@example.com' };
    await handleSettingsUpdate(backend, payload);

    expect(backend.saveSettings).toHaveBeenCalledWith(payload);
  });

  it('throws when shopId missing', async () => {
    const backend = {
      saveSettings: vi.fn(),
    } as unknown as BackendService;

    await expect(
      handleSettingsUpdate(backend, { shopId: '', email: 'merchant@example.com' })
    ).rejects.toThrowError('shopId is required');
  });

  it('throws when email missing', async () => {
    const backend = {
      saveSettings: vi.fn(),
    } as unknown as BackendService;

    await expect(
      handleSettingsUpdate(backend, { shopId: 'demo', email: '' })
    ).rejects.toThrowError('email is required');
  });
});

describe('handleSettingsFetch', () => {
  it('requests settings for shop', async () => {
    const backend = {
      getSettings: vi.fn().mockResolvedValue({ email: 'merchant@example.com' }),
    } as unknown as BackendService;

    const response = await handleSettingsFetch(backend, 'shop-id');

    expect(backend.getSettings).toHaveBeenCalledWith('shop-id');
    expect(response).toEqual({ email: 'merchant@example.com' });
  });

  it('throws when shopId missing', async () => {
    const backend = {
      getSettings: vi.fn(),
    } as unknown as BackendService;

    await expect(handleSettingsFetch(backend, undefined)).rejects.toThrowError('shopId is required');
  });
});
