<?php
/**
 * WooCommerce event hooks for SerenAI monitoring.
 */

if (!defined('ABSPATH')) {
    exit;
}

class SerenAI_Hooks {

    private $api;

    public function __construct(SerenAI_API $api) {
        $this->api = $api;

        // Only hook if registered
        if ($this->api->is_registered()) {
            $this->register_hooks();
        }
    }

    /**
     * Register WooCommerce hooks.
     */
    private function register_hooks() {
        // Checkout started
        add_action('woocommerce_checkout_process', array($this, 'on_checkout_started'));

        // Order created (successful payment)
        add_action('woocommerce_checkout_order_processed', array($this, 'on_order_created'), 10, 3);

        // Order status changes
        add_action('woocommerce_order_status_changed', array($this, 'on_order_status_changed'), 10, 4);

        // Payment failed
        add_action('woocommerce_order_status_failed', array($this, 'on_order_failed'), 10, 2);
    }

    /**
     * Handle checkout started event.
     */
    public function on_checkout_started() {
        $this->api->send_event('checkout_started', array(
            'cart_total' => WC()->cart ? WC()->cart->get_total('edit') : 0,
            'cart_items' => WC()->cart ? WC()->cart->get_cart_contents_count() : 0,
        ));
    }

    /**
     * Handle order created event.
     *
     * @param int $order_id Order ID
     * @param array $posted_data Posted checkout data
     * @param WC_Order $order Order object
     */
    public function on_order_created($order_id, $posted_data, $order) {
        $financial_status = $this->map_order_status_to_financial($order->get_status());

        $this->api->send_event('order_created', array(
            'order_id' => $order_id,
            'order_total' => (int) ($order->get_total() * 100), // Convert to cents
            'financial_status' => $financial_status,
            'payment_method' => $order->get_payment_method(),
            'currency' => $order->get_currency(),
        ));
    }

    /**
     * Handle order status changes.
     *
     * @param int $order_id Order ID
     * @param string $old_status Old status
     * @param string $new_status New status
     * @param WC_Order $order Order object
     */
    public function on_order_status_changed($order_id, $old_status, $new_status, $order) {
        // Only track certain transitions
        if (in_array($new_status, array('completed', 'processing'))) {
            $this->api->send_event('order_created', array(
                'order_id' => $order_id,
                'order_total' => (int) ($order->get_total() * 100),
                'financial_status' => 'paid',
                'status_transition' => $old_status . ' -> ' . $new_status,
            ));
        }
    }

    /**
     * Handle payment failed event.
     *
     * @param int $order_id Order ID
     * @param WC_Order $order Order object (optional in some versions)
     */
    public function on_order_failed($order_id, $order = null) {
        if (!$order) {
            $order = wc_get_order($order_id);
        }

        if (!$order) {
            return;
        }

        $this->api->send_event('order_failed', array(
            'order_id' => $order_id,
            'order_total' => (int) ($order->get_total() * 100),
            'financial_status' => 'failed',
            'payment_method' => $order->get_payment_method(),
        ));
    }

    /**
     * Map WooCommerce order status to our financial status.
     *
     * @param string $status WooCommerce status
     * @return string|null Our financial status
     */
    private function map_order_status_to_financial($status) {
        $map = array(
            'completed' => 'paid',
            'processing' => 'pending',
            'on-hold' => 'pending',
            'pending' => 'pending',
            'failed' => 'failed',
            'cancelled' => 'failed',
            'refunded' => 'failed',
        );

        return $map[$status] ?? 'pending';
    }
}
