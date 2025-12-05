<?php
/**
 * Plugin activation and deactivation handlers.
 */

if (!defined('ABSPATH')) {
    exit;
}

class SerenAI_Activator {

    /**
     * Run on plugin activation.
     */
    public static function activate() {
        // Check PHP version
        if (version_compare(PHP_VERSION, '7.4', '<')) {
            deactivate_plugins(plugin_basename(__FILE__));
            wp_die(__('SerenAI Monitor requires PHP 7.4 or higher.', 'serenai-monitor'));
        }

        // Check WordPress version
        if (version_compare(get_bloginfo('version'), '5.8', '<')) {
            deactivate_plugins(plugin_basename(__FILE__));
            wp_die(__('SerenAI Monitor requires WordPress 5.8 or higher.', 'serenai-monitor'));
        }

        // Set default options
        add_option('serenai_email', '');
        add_option('serenai_webhook_url', '');
        add_option('serenai_api_key', '');
        add_option('serenai_activated_at', current_time('timestamp'));

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Run on plugin deactivation.
     */
    public static function deactivate() {
        // Optionally notify backend of deactivation
        $api_key = get_option('serenai_api_key', '');

        if (!empty($api_key)) {
            // Fire and forget - don't block deactivation
            wp_remote_post(SERENAI_BACKEND_URL . '/api/merchants/deactivate', array(
                'timeout' => 5,
                'blocking' => false,
                'headers' => array(
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $api_key,
                ),
                'body' => wp_json_encode(array(
                    'shop_id' => 'woo_' . md5(get_site_url()),
                )),
            ));
        }

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Run on plugin uninstall (static method called from uninstall.php).
     */
    public static function uninstall() {
        // Remove all plugin options
        delete_option('serenai_email');
        delete_option('serenai_webhook_url');
        delete_option('serenai_api_key');
        delete_option('serenai_activated_at');
    }
}
