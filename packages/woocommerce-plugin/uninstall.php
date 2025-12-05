<?php
/**
 * Uninstall script - runs when plugin is deleted.
 */

// Exit if not called by WordPress
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

require_once plugin_dir_path(__FILE__) . 'includes/class-serenai-activator.php';
SerenAI_Activator::uninstall();
