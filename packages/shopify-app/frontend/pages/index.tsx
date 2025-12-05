import '@shopify/polaris/build/esm/styles.css';
import enTranslations from '@shopify/polaris/locales/en.json';
import { AppProvider, Card, Layout, Page, Text } from '@shopify/polaris';
import { SettingsForm } from '../components/SettingsForm.js';

export default function IndexPage() {
  return (
    <AppProvider i18n={enTranslations}>
      <Page title="SerenAI E-commerce Monitor" subtitle="Configure alerting preferences for your store">
        <Layout>
          <Layout.Section>
            <Card>
              <Card.Section>
                <Text as="p" variant="bodyMd">
                  Provide an email for anomaly alerts and optionally relay the same events to a webhook. Settings are synced to
                  SerenAI&apos;s backend via `/api/settings`.
                </Text>
              </Card.Section>
              <Card.Section>
                <SettingsForm />
              </Card.Section>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppProvider>
  );
}
