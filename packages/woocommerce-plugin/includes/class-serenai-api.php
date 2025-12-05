<?php
/**
 * SerenAI API client for communicating with the backend.
 */

if (!defined('ABSPATH')) {
    exit;
}

class SerenAI_API {

    private $backend_url;
    private $api_key;

    public function __construct() {
        $this->backend_url = SERENAI_BACKEND_URL;
        $this->api_key = get_option('serenai_api_key', '');
    }

    /**
     * Get unique shop identifier.
     * Uses site URL hash for consistency.
     *
     * @return string Shop ID
     */
    public function get_shop_id() {
        return 'woo_' . md5(get_site_url());
    }

    /**
     * Check if plugin is registered with backend.
     *
     * @return bool
     */
    public function is_registered() {
        return !empty($this->api_key);
    }

        /**
     * Register this store with the SerenAI backend.
     * Called on plugin activation or when settings are saved.
     *
     * @param string $email Merchant email for alerts
     * @param string $webhook_url Optional webhook URL
     * @return array|WP_Error Response or error
     */
    public function register_merchant($email, $webhook_url = '', $alerts_enabled = true) {
        $shop_id = $this->get_shop_id();

        $response = wp_remote_post($this->backend_url . '/api/merchants/register', array(
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
            'body' => wp_json_encode(array(
                'shop_id' => $shop_id,
                'platform' => 'woocommerce',
                'email' => $email,
                'webhook_url' => $webhook_url,
                'alerts_enabled' => $alerts_enabled,
            )),
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        // Store API key if returned
        if (!empty($body['api_key'])) {
            update_option('serenai_api_key', $body['api_key']);
            $this->api_key = $body['api_key'];
        }

        return $body;
    }

    /**
     * Update merchant settings.
     *
     * @param string $email Merchant email
     * @param string $webhook_url Optional webhook URL
     * @return array|WP_Error Response or error
     */
    public function update_settings($email, $webhook_url = '', $alerts_enabled = true) {
        if (empty($this->api_key)) {
            return new WP_Error('no_api_key', 'Not registered with SerenAI');
        }

        $response = wp_remote_request($this->backend_url . '/api/merchants/settings', array(
            'method' => 'PATCH',
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->api_key,
            ),
            'body' => wp_json_encode(array(
                'shop_id' => $this->get_shop_id(),
                'email' => $email,
                'webhook_url' => $webhook_url,
                'alerts_enabled' => $alerts_enabled,
            )),
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        return json_decode(wp_remote_retrieve_body($response), true);
    }

        /**
     * Send an event to the backend.
     *
     * @param string $event_type checkout_started|order_created|order_failed
     * @param array $data Event data
     * @return array|WP_Error Response or error
     */
    public function send_event($event_type, $data) {
        if (empty($this->api_key)) {
            // Silently fail if not registered
            return array('status' => 'not_registered');
        }

        $payload = array(
            'shop_id' => $this->get_shop_id(),
            'platform' => 'woocommerce',
            'event_type' => $event_type,
            'financial_status' => $data['financial_status'] ?? null,
            'order_total' => $data['order_total'] ?? null,
            'timestamp' => current_time('c'),
            'raw_payload' => $data,
        );

        $response = wp_remote_post($this->backend_url . '/events', array(
            'timeout' => 10, // Short timeout for event logging
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->api_key,
            ),
            'body' => wp_json_encode($payload),
        ));

        if (is_wp_error($response)) {
            // Log error but don't disrupt checkout
            error_log('SerenAI event send failed: ' . $response->get_error_message());
            return $response;
        }

        return json_decode(wp_remote_retrieve_body($response), true);
    }

