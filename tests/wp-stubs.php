<?php
// Isolated renderer tests: not part of the release package or a production route.
define('ABSPATH', __DIR__);
$GLOBALS['mdm_test_actions'] = [];
$GLOBALS['mdm_test_shortcodes'] = [];
$GLOBALS['mdm_test_assets'] = [];
function add_action($name, $callback, $priority = 10) { $GLOBALS['mdm_test_actions'][$name][] = $callback; }
function add_shortcode($name, $callback) { $GLOBALS['mdm_test_shortcodes'][$name] = $callback; }
function shortcode_exists($name) { return isset($GLOBALS['mdm_test_shortcodes'][$name]); }
function wp_enqueue_style(...$args) { $GLOBALS['mdm_test_assets']['styles'][$args[0]] = $args; }
function wp_enqueue_script(...$args) { $GLOBALS['mdm_test_assets']['scripts'][$args[0]] = $args; }
function plugins_url($path, $file) { return '/'. $path; }
function home_url($path) { return 'https://missiondrivenministries.org' . $path; }
function esc_attr($value) { return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'); }
function esc_html($value) { return esc_attr($value); }
function esc_url($value) { return preg_match('#^https?://#', $value) ? esc_attr($value) : ''; }
function wp_unique_id($prefix) { static $id = 0; return $prefix . ++$id; }
function get_post() { return (object) ['post_content' => '[mdm_partner_map]']; }
function is_front_page() { return true; }
function has_shortcode($content, $shortcode) { return strpos($content, '[' . $shortcode) !== false; }
require dirname(__DIR__) . '/mdm-partner-map.php';
