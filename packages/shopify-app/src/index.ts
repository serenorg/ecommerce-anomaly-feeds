import express from 'express';
import dotenv from 'dotenv';
import { configureShopify } from './shopify.js';
import { createAuthRouter } from './routes/auth.js';
import { createWebhookRouter } from './routes/webhooks.js';
import { createSettingsRouter } from './routes/settings.js';

dotenv.config();

const app = express();
const shopify = configureShopify();

app.use('/api/webhooks/shopify', express.raw({ type: 'application/json' }), createWebhookRouter());
app.use(express.json());
app.use('/auth', createAuthRouter(shopify));
app.use('/api/settings', createSettingsRouter());

const port = Number(process.env.PORT ?? 3000);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`SerenAI Shopify app listening on port ${port}`); // eslint-disable-line no-console
  });
}

export { app };
