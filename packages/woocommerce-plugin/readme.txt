=== SerenAI E-commerce Monitor ===
Contributors: serenai
Tags: woocommerce, monitoring, checkout, alerts, e-commerce
Requires at least: 5.8
Tested up to: 6.4
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Real-time checkout monitoring and anomaly alerts for your WooCommerce store.

== Description ==

SerenAI E-commerce Monitor watches your WooCommerce checkout for critical issues and alerts you immediately when problems are detected.

**What We Monitor:**

* **Payment Gateway Failures** - Alerts when 40%+ of transactions fail
* **Checkout Abandonment** - Alerts when checkouts start but none complete
* **Recovery** - Good news! We'll tell you when issues resolve

**Features:**

* Real-time monitoring
* Email alerts
* Optional webhook integration (Slack, Discord, Zapier)
* No impact on checkout performance

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to WooCommerce > SerenAI Monitor
4. Enter your email address and save

== Frequently Asked Questions ==

= Does this slow down my checkout? =

No. Events are sent asynchronously and do not block your checkout process.

= What data do you collect? =

We collect order counts, totals, and success/failure status. We never collect customer personal information.

== Changelog ==

= 1.0.0 =
* Initial release
