<?php
/**
 * Plugin Name: MDM Partner Map
 * Plugin URI: https://github.com/stronganchor/mdm-partner-map
 * Description: A small, accessible, self-contained regional partner map for Mission Driven Ministries.
 * Version: 1.0.1
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Update URI: https://github.com/stronganchor/mdm-partner-map
 * Author: Strong Anchor Tech
 * Author URI: https://stronganchortech.com
 * License: GPL-2.0-or-later
 * Text Domain: mdm-partner-map
 */

namespace StrongAnchor\MDMPartnerMap;

if (!defined('ABSPATH')) {
    exit;
}

const VERSION = '1.0.1';

/** Bundled data only: never accept a file, URL, map name, or markup from a request. */
function data(string $name): array {
    static $cache = [];
    if (!in_array($name, ['partners', 'regions'], true)) {
        return [];
    }
    if (!isset($cache[$name])) {
        $decoded = json_decode((string) file_get_contents(__DIR__ . '/data/' . $name . '.json'), true);
        $cache[$name] = is_array($decoded) ? $decoded : [];
    }
    return $cache[$name];
}

function assets(): void {
    wp_enqueue_style('mdm-partner-map', plugins_url('assets/map.css', __FILE__), [], VERSION);
    wp_enqueue_script('mdm-partner-map', plugins_url('assets/map.js', __FILE__), [], VERSION, true);
}

function maybe_assets(): void {
    $post = get_post();
    if (is_front_page() || ($post && (
        has_shortcode($post->post_content, 'mdm_partner_map') ||
        has_shortcode($post->post_content, 'display-map') ||
        has_shortcode($post->post_content, 'display-igmap')
    ))) {
        assets();
    }
}

/** Only the old map 999 is supported, so old revisions do not depend on MapGeo. */
function legacy_shortcode($atts = []): string {
    return is_array($atts) && isset($atts['id']) && is_scalar($atts['id']) && (string) $atts['id'] === '999' ? render() : '';
}

function render($atts = []): string {
    // Deliberately ignore every shortcode attribute, including demo, URL, and HTML.
    $partners = data('partners');
    $map = data('regions');
    if (!$partners || empty($map['regions'])) {
        return '';
    }
    assets();
    $id = wp_unique_id('mdm-partner-map-');
    $by_region = [];
    foreach ($partners as $partner) {
        $by_region[$partner['subregion']] = $partner;
    }
    ob_start();
    ?>
    <div class="mdm-partner-map" data-mdm-partner-map data-version="<?php echo esc_attr(VERSION); ?>">
        <div class="mdm-map-viewport">
            <svg class="mdm-map-svg" viewBox="0 0 1000 560" role="group" aria-labelledby="<?php echo esc_attr($id . '-title'); ?>" xmlns="http://www.w3.org/2000/svg">
                <title id="<?php echo esc_attr($id . '-title'); ?>">Mission Driven Ministries partner regions</title>
                <?php foreach ($map['regions'] as $region) : ?>
                    <?php if (isset($by_region[$region['name']])) : $partner = $by_region[$region['name']]; ?>
                        <a class="mdm-map-region" href="<?php echo esc_url(home_url($partner['path'])); ?>" aria-label="<?php echo esc_attr($partner['label'] . ' partners'); ?>" data-region="<?php echo esc_attr($partner['id']); ?>">
                            <title><?php echo esc_html($partner['label']); ?></title>
                            <path d="<?php echo esc_attr($region['d']); ?>" />
                        </a>
                    <?php else : ?>
                        <path class="mdm-map-inactive" d="<?php echo esc_attr($region['d']); ?>" aria-hidden="true" />
                    <?php endif; ?>
                <?php endforeach; ?>
            </svg>
            <div class="mdm-map-loading" role="status" aria-live="polite" aria-atomic="true">
                <span class="mdm-map-spinner" aria-hidden="true"></span>
                <span class="mdm-map-loading-text"></span>
            </div>
        </div>
        <details class="mdm-map-directory">
            <summary>Browse partners by region</summary>
            <ul>
                <?php foreach ($partners as $partner) : ?>
                    <li><a href="<?php echo esc_url(home_url($partner['path'])); ?>"><?php echo esc_html($partner['label']); ?></a></li>
                <?php endforeach; ?>
            </ul>
        </details>
    </div>
    <?php
    return (string) ob_get_clean();
}

function register(): void {
    add_shortcode('mdm_partner_map', __NAMESPACE__ . '\\render');
    // Compatibility aliases only; the homepage uses the new shortcode after migration.
    if (!shortcode_exists('display-map')) {
        add_shortcode('display-map', __NAMESPACE__ . '\\legacy_shortcode');
    }
    if (!shortcode_exists('display-igmap')) {
        add_shortcode('display-igmap', __NAMESPACE__ . '\\legacy_shortcode');
    }
}

add_action('init', __NAMESPACE__ . '\\register', 20);
add_action('wp_enqueue_scripts', __NAMESPACE__ . '\\maybe_assets');

// Keep maintenance on the established GitHub/WordPress updater, without a site token.
function updates(): void {
    require_once __DIR__ . '/plugin-update-checker/plugin-update-checker.php';
    $update_checker = \YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
        'https://github.com/stronganchor/mdm-partner-map', __FILE__, 'mdm-partner-map'
    );
    $update_checker->setBranch('main');
    $update_checker->getVcsApi()->enableReleaseAssets('/^mdm-partner-map-v[0-9.]+\\.zip$/');
}
add_action('plugins_loaded', __NAMESPACE__ . '\\updates');
