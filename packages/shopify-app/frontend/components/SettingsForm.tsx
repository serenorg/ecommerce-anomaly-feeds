import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Banner, Button, FormLayout, TextField } from '@shopify/polaris';

type SettingsFormProps = {
  initialShopId?: string;
};

function resolveShopParam(explicitShop?: string) {
  if (explicitShop) {
    return explicitShop;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('shop') ?? '';
}

export function SettingsForm({ initialShopId }: SettingsFormProps) {
  const shopId = useMemo(() => resolveShopParam(initialShopId), [initialShopId]);
  const [email, setEmail] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      if (!shopId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/settings?shopId=${encodeURIComponent(shopId)}`);
        if (response.ok) {
          const data = (await response.json()) as { email?: string; webhookUrl?: string };
          setEmail(data.email ?? '');
          setWebhookUrl(data.webhookUrl ?? '');
        } else if (response.status !== 404) {
          setErrorMessage('Unable to load existing settings');
        }
      } catch (error) {
        console.error('Failed to load settings', error);
        setErrorMessage('Network error while loading settings');
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, [shopId]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSuccessMessage(null);
      setErrorMessage(null);

      if (!shopId) {
        setErrorMessage('Missing shop parameter. Append `?shop=your-store.myshopify.com` to the URL.');
        return;
      }

      setSaving(true);
      try {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shopId,
            email,
            webhookUrl: webhookUrl || undefined,
          }),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || 'Request failed');
        }

        setSuccessMessage('Settings saved. Future anomalies will email this address.');
      } catch (error) {
        console.error('Failed to save settings', error);
        setErrorMessage('Unable to save settings. Check console/logs for details.');
      } finally {
        setSaving(false);
      }
    },
    [shopId, email, webhookUrl]
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormLayout>
        {!shopId && (
          <Banner title="Shop parameter required" tone="critical">
            Append `?shop=your-store.myshopify.com` to the admin URL so SerenAI can associate settings with a store.
          </Banner>
        )}
        {successMessage && (
          <Banner title="Settings saved" tone="success">
            {successMessage}
          </Banner>
        )}
        {errorMessage && (
          <Banner title="Something went wrong" tone="critical">
            {errorMessage}
          </Banner>
        )}

        <TextField label="Shop Domain" value={shopId} disabled helpText="Derived from the `shop` query parameter." />
        <TextField
          label="Alert Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder="merchant@example.com"
          requiredIndicator
          helpText="All anomaly alerts are sent here."
        />
        <TextField
          label="Optional Webhook URL"
          type="url"
          value={webhookUrl}
          onChange={setWebhookUrl}
          placeholder="https://hooks.slack.com/..."
          helpText="Use this to mirror alerts into Slack, PagerDuty, etc."
        />

        <Button primary submit loading={saving} disabled={!shopId || !email || loading}>
          Save Settings
        </Button>
      </FormLayout>
    </form>
  );
}
