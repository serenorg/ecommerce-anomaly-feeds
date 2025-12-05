# SerenAI E-commerce Monitor

Real-time anomaly detection for Shopify and WooCommerce stores.

## Overview

SerenAI E-commerce Monitor watches your online store's checkout for critical issues and alerts you immediately when problems are detected.

**What We Monitor:**

- **Payment Gateway Failures** - Alerts when 40%+ of transactions fail
- **Checkout Abandonment** - Alerts when checkouts start but none complete
- **Recovery** - We'll notify you when issues resolve

## Platform Integrations

### WooCommerce Plugin

Download the latest release from the [Releases page](https://github.com/serenorg/serenai-ecommerce-anomaly-feeds/releases).

**Installation:**

1. Download `serenai-monitor-x.x.x.zip` from the latest release
2. In WordPress admin, go to Plugins > Add New > Upload Plugin
3. Upload the ZIP file and activate
4. Go to WooCommerce > SerenAI Monitor
5. Enter your email address and save

[Full WooCommerce documentation](packages/woocommerce-plugin/readme.txt)

### Shopify App

Coming soon to the Shopify App Store.

[View Shopify App source](packages/shopify-app/)

## Features

- **Real-time monitoring** - Events processed as they happen
- **Email alerts** - Instant notifications to your inbox
- **Webhook integration** - Connect to Slack, Discord, or Zapier
- **Zero checkout impact** - Asynchronous event collection

## Anomaly Detection

| Anomaly Type | Threshold | Time Window |
|--------------|-----------|-------------|
| Payment Failure Spike | ≥40% failure rate | 5 minutes |
| Checkout Abandonment | 0% completion rate | 15 minutes |
| Recovery | <20% failure rate | After anomaly |

## Data Collection & Privacy

### What We Collect

For each checkout/order event, we collect:

- **Store identifier** (e.g., `my-store.myshopify.com`)
- **Order totals** (transaction amounts)
- **Order counts** (number of transactions)
- **Payment status** (success/failure)
- **Timestamps**

### What We DO NOT Collect

- Customer names, emails, or contact information
- Shipping or billing addresses
- Payment card numbers or financial details
- Product details or SKUs
- Any personally identifiable information (PII)

### How We Use Your Data

1. **Anomaly Detection** - We analyze transaction patterns to detect payment failures and checkout abandonment in real-time
2. **Alerting** - We send alerts only to the email address you configure
3. **Aggregate Marketplace Signals** - Transaction data is anonymized and aggregated across merchants (with k-anonymity protections) to provide marketplace insights

### Data Retention

- Raw event data: 30 days
- Aggregated signals: 1 year
- You can request data deletion at any time by contacting [hello@serendb.com](mailto:hello@serendb.com)

## API Endpoints

For platform integrations, events are sent to:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/events` | POST | Submit checkout/payment events |
| `/merchants` | POST | Register your store |
| `/health` | GET | API health check |

## Support

- **Issues**: [GitHub Issues](https://github.com/serenorg/serenai-ecommerce-anomaly-feeds/issues)
- **Email**: [hello@serendb.com](mailto:hello@serendb.com)

## License

The WooCommerce plugin is licensed under GPLv2 (required for WordPress plugins).
The Shopify app is proprietary software - SerenAI Inc.

Copyright (c) 2024 SerenAI Inc.
