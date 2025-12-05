<?php
/**
 * Admin settings page for SerenAI Monitor.
 */

if (!defined('ABSPATH')) {
    exit;
}

class SerenAI_Admin {

    private $api;

    public function __construct(SerenAI_API $api) {
        $this->api = $api;

        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_styles'));
    }

    /**
     * Add menu item under WooCommerce.
     */
    public function add_admin_menu() {
        add_submenu_page(
            'woocommerce',
            __('SerenAI Monitor', 'serenai-monitor'),
            __('SerenAI Monitor', 'serenai-monitor'),
            'manage_woocommerce',
            'serenai-monitor',
            array($this, 'render_settings_page')
        );
    }

    /**
     * Register settings fields.
     */
    public function register_settings() {
                register_setting('serenai_settings', 'serenai_email', array(
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_email',
                ));
        
                register_setting('serenai_settings', 'serenai_webhook_url', array(
                    'type' => 'string',
                    'sanitize_callback' => 'esc_url_raw',
                ));
        
                register_setting('serenai_settings', 'serenai_alerts_enabled', array(
                    'type' => 'boolean',
                    'sanitize_callback' => 'rest_sanitize_boolean',
                    'default' => true,
                ));
        
                add_settings_section(
                    'serenai_main_section',
                    __('Alert Settings', 'serenai-monitor'),
                    array($this, 'render_section_description'),
                    'serenai-monitor'
                );
        
                add_settings_field(
                    'serenai_email',
                    __('Email Address', 'serenai-monitor'),
                    array($this, 'render_email_field'),
                    'serenai-monitor',
                    'serenai_main_section'
                );
        
                add_settings_field(
                    'serenai_webhook_url',
                    __('Webhook URL (Optional)', 'serenai-monitor'),
                    array($this, 'render_webhook_field'),
                    'serenai-monitor',
                    'serenai_main_section'
                );
                
                add_settings_field(
                    'serenai_alerts_enabled',
                    __('Enable Anomaly Alerts', 'serenai-monitor'),
                    array($this, 'render_alerts_enabled_field'),
                    'serenai-monitor',
                    'serenai_main_section'
                );
            }
        
            /**
             * Render settings page.
             */
            public function render_settings_page() {
                // Handle form submission
                if (isset($_POST['serenai_save_settings']) && check_admin_referer('serenai_settings_nonce')) {
                    $email = sanitize_email($_POST['serenai_email'] ?? '');
                    $webhook_url = esc_url_raw($_POST['serenai_webhook_url'] ?? '');
                    $alerts_enabled = isset($_POST['serenai_alerts_enabled']) ? true : false;
        
                    if (!is_email($email)) {
                        add_settings_error('serenai_settings', 'invalid_email', __('Please enter a valid email address.', 'serenai-monitor'));
                    } else {
                        update_option('serenai_email', $email);
                        update_option('serenai_webhook_url', $webhook_url);
                        update_option('serenai_alerts_enabled', $alerts_enabled);
        
                        // Register/update with backend
                        if ($this->api->is_registered()) {
                            $result = $this->api->update_settings($email, $webhook_url, $alerts_enabled);
                        } else {
                            $result = $this->api->register_merchant($email, $webhook_url, $alerts_enabled);
                        }
        
                        if (is_wp_error($result)) {
                            add_settings_error('serenai_settings', 'api_error',
                                __('Failed to sync with SerenAI: ', 'serenai-monitor') . $result->get_error_message());
                        } else {
                            add_settings_error('serenai_settings', 'settings_saved',
                                __('Settings saved successfully!', 'serenai-monitor'), 'success');
                        }
                    }
                }
        
                $email = get_option('serenai_email', '');
                $webhook_url = get_option('serenai_webhook_url', '');
                $alerts_enabled = get_option('serenai_alerts_enabled', true);
                $is_registered = $this->api->is_registered();
        
                ?>
                <div class="wrap serenai-admin">
                    <h1><?php _e('SerenAI E-commerce Monitor', 'serenai-monitor'); ?></h1>
        
                    <?php settings_errors('serenai_settings'); ?>
        
                    <div class="serenai-status-box">
                        <h2><?php _e('Status', 'serenai-monitor'); ?></h2>
                        <?php if ($is_registered): ?>
                            <p class="serenai-status serenai-status-active">
                                ✓ <?php _e('Connected and monitoring your store', 'serenai-monitor'); ?>
                            </p>
                        <?php else: ?>
                            <p class="serenai-status serenai-status-inactive">
                                ○ <?php _e('Not connected. Enter your email and save to activate.', 'serenai-monitor'); ?>
                            </p>
                        <?php endif; ?>
                    </div>
        
                    <form method="post" action="">
                        <?php wp_nonce_field('serenai_settings_nonce'); ?>
        
                        <table class="form-table">
                            <tr>
                                <th scope="row">
                                    <label for="serenai_email"><?php _e('Email Address', 'serenai-monitor'); ?></label>
                                </th>
                                <td>
                                    <input type="email"
                                           id="serenai_email"
                                           name="serenai_email"
                                           value="<?php echo esc_attr($email); ?>"
                                           class="regular-text"
                                           required />
                                    <p class="description">
                                        <?php _e("We'll send anomaly alerts to this email address.", 'serenai-monitor'); ?>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <label for="serenai_webhook_url"><?php _e('Webhook URL (Optional)', 'serenai-monitor'); ?></label>
                                </th>
                                <td>
                                    <input type="url"
                                           id="serenai_webhook_url"
                                           name="serenai_webhook_url"
                                           value="<?php echo esc_attr($webhook_url); ?>"
                                           class="regular-text"
                                           placeholder="https://hooks.slack.com/services/..." />
                                    <p class="description">
                                        <?php _e('Optionally receive alerts via webhook (Slack, Discord, Zapier, etc.)', 'serenai-monitor'); ?>
                                    </p>
                                </td>
                            </tr>
                             <tr>
                                <th scope="row">
                                    <label for="serenai_alerts_enabled"><?php _e('Enable Anomaly Alerts', 'serenai-monitor'); ?></label>
                                </th>
                                <td>
                                    <input type="checkbox"
                                           id="serenai_alerts_enabled"
                                           name="serenai_alerts_enabled"
                                           value="1"
                                           <?php checked(1, $alerts_enabled); ?> />
                                    <p class="description">
                                        <?php _e('Check to enable real-time anomaly alerts for your store.', 'serenai-monitor'); ?>
                                    </p>
                                </td>
                            </tr>
                        </table>
        
                        <p class="submit">
                            <input type="submit"
                                   name="serenai_save_settings"
                                   class="button button-primary"
                                   value="<?php _e('Save Settings', 'serenai-monitor'); ?>" />
                        </p>
                    </form>
        
                    <div class="serenai-info-box">
                        <h2><?php _e('What We Monitor', 'serenai-monitor'); ?></h2>
                        <ul>
                            <li><strong><?php _e('Payment Gateway Failures', 'serenai-monitor'); ?></strong> -
                                <?php _e('Alerts when 40%+ of transactions fail', 'serenai-monitor'); ?></li>
                            <li><strong><?php _e('Checkout Abandonment', 'serenai-monitor'); ?></strong> -
                                <?php _e('Alerts when checkouts start but none complete', 'serenai-monitor'); ?></li>
                            <li><strong><?php _e('Recovery', 'serenai-monitor'); ?></strong> -
                                <?php _e("Good news! We'll tell you when issues resolve", 'serenai-monitor'); ?></li>
                        </ul>
                    </div>
                </div>
                <?php
            }
        
            /**
             * Enqueue admin styles.
             */
            public function enqueue_styles($hook) {
                if ('woocommerce_page_serenai-monitor' !== $hook) {
                    return;
                }
        
                wp_enqueue_style(
                    'serenai-admin',
                    SERENAI_PLUGIN_URL . 'assets/css/admin.css',
                    array(),
                    SERENAI_VERSION
                );
            }
        
            public function render_section_description() {
                echo '<p>' . __('Configure how you receive anomaly alerts.', 'serenai-monitor') . '</p>';
            }
        
            public function render_email_field() {
                $email = get_option('serenai_email', '');
                echo '<input type="email" id="serenai_email" name="serenai_email" value="' . esc_attr($email) . '" class="regular-text" required />';
            }
        
            public function render_webhook_field() {
                $webhook = get_option('serenai_webhook_url', '');
                echo '<input type="url" id="serenai_webhook_url" name="serenai_webhook_url" value="' . esc_attr($webhook) . '" class="regular-text" placeholder="https://hooks.slack.com/services/..." />';
            }
        
            public function render_alerts_enabled_field() {
                $alerts_enabled = get_option('serenai_alerts_enabled', true);
                echo '<input type="checkbox" id="serenai_alerts_enabled" name="serenai_alerts_enabled" value="1" ' . checked(1, $alerts_enabled, false) . ' />';
            }
        }
