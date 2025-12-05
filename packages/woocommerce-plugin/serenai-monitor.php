<?php
/**
 * Plugin Name: SerenAI E-commerce Monitor
 * Plugin URI: https://serenai.com/woocommerce
 * Description: Real-time checkout monitoring and anomaly alerts for your WooCommerce store.
 * Version: 1.0.0
 * Author: SerenAI
 * Author URI: https://serenai.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: serenai-monitor
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * WC tested up to: 8.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('SERENAI_VERSION', '1.0.0');
define('SERENAI_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SERENAI_PLUGIN_URL', plugin_dir_url(__FILE__));
define('SERENAI_BACKEND_URL', 'https://toolshed.serenai.com');

// Check if WooCommerce is active
function serenai_check_woocommerce() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', 'serenai_woocommerce_missing_notice');
        return false;
    }
    return true;
}

function serenai_woocommerce_missing_notice() {
    ?>
    <div class="notice notice-error">
        <p><?php _e('SerenAI Monitor requires WooCommerce to be installed and active.', 'serenai-monitor'); ?></p>
    </div>
    <?php
}

// Initialize plugin
function serenai_init() {
    if (!serenai_check_woocommerce()) {
        return;
    }

    // Load includes - these files don't exist yet, but will be created in later tasks
    // require_once SERENAI_PLUGIN_DIR . 'includes/class-serenai-api.php';
    // require_once SERENAI_PLUGIN_DIR . 'includes/class-serenai-admin.php';
    // require_once SERENAI_PLUGIN_DIR . 'includes/class-serenai-hooks.php';

    // Initialize classes - these classes don't exist yet
    // $api = new SerenAI_API();
    // new SerenAI_Admin($api);
    // new SerenAI_Hooks($api);
}
add_action('plugins_loaded', 'serenai_init');

register_activation_hook(__FILE__, 'serenai_activate');
function serenai_activate() {
    require_once SERENAI_PLUGIN_DIR . 'includes/class-serenai-activator.php';
    SerenAI_Activator::activate();
}

// Deactivation hook
register_deactivation_hook(__FILE__, 'serenai_deactivate');
function serenai_deactivate() {
    require_once SERENAI_PLUGIN_DIR . 'includes/class-serenai-activator.php';
    SerenAI_Activator::deactivate();
}
