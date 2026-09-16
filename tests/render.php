<?php
require __DIR__ . '/wp-stubs.php';
use function StrongAnchor\MDMPartnerMap\render;
use function StrongAnchor\MDMPartnerMap\legacy_shortcode;
use function StrongAnchor\MDMPartnerMap\data;
use function StrongAnchor\MDMPartnerMap\register;

$tests = 0;
function check($ok, $message) {
    global $tests;
    if (!$ok) { throw new RuntimeException($message); }
    ++$tests;
    echo "PASS: $message\n";
}
function normalize_map($html) { return preg_replace('/mdm-partner-map-\d+/', 'mdm-partner-map-ID', $html); }
$clean = render();
check(substr_count($clean, 'class="mdm-map-region"') === 12, 'All 12 active region links render');
check(substr_count($clean, '<li><a href=') === 12, 'All 12 accessible directory links render');
foreach (data('partners') as $partner) {
    check(substr_count($clean, 'href="' . home_url($partner['path']) . '"') === 2, $partner['label'] . ' exact destination retained twice');
}
check(strpos($clean, '<script') === false && strpos($clean, 'onload=') === false, 'Renderer emits no executable inline script');
check(strpos($clean, 'role="group"') !== false, 'SVG retains accessible child links');
check(strpos($clean, '<details') !== false, 'No-JavaScript text directory exists');
check(strpos($clean, 'Choose a blue region') === false && strpos($clean, 'mdm-map-help') === false, 'Introductory instruction is removed');
check(strpos($clean, 'mdm-map-controls') === false && strpos($clean, '<button') === false, 'Zoom controls are removed');
check(strpos($clean, 'aria-describedby') === false, 'No dangling reference to the removed help text');
check(strpos($clean, 'role="status" aria-live="polite" aria-atomic="true"') !== false, 'Accessible loading status exists outside the SVG');
check(strpos($clean, 'data-version="1.0.1"') !== false, 'Current version is rendered');
check(normalize_map(legacy_shortcode(['id' => '999'])) === normalize_map($clean), 'Legacy map 999 maps to independent renderer');
foreach ([[], ['id' => 0], ['id' => '999x'], ['id' => ['999']], ['id' => '../999'], ['id' => '<svg/onload=alert(1)>']] as $invalid) {
    check(legacy_shortcode($invalid) === '', 'Unsupported legacy map fails closed: ' . json_encode($invalid));
}
$_GET = ['map' => '//attacker.invalid/x.js', 'debug' => '<script>alert(1)</script>', 'file' => '../../wp-config.php'];
$_POST = $_REQUEST = $_GET;
check(normalize_map(render(['demo' => 1, 'url' => 'javascript:alert(1)', 'id' => '<svg/onload=alert(1)>'])) === normalize_map($clean), 'Untrusted requests and shortcode attributes cannot alter output');
check(data('../../wp-config') === [], 'Data file allowlist rejects arbitrary names');
register();
check(count($GLOBALS['mdm_test_shortcodes']) === 3, 'Registers one canonical and two bounded compatibility shortcodes');
$GLOBALS['mdm_test_shortcodes']['display-map'] = 'foreign-plugin';
register();
check($GLOBALS['mdm_test_shortcodes']['display-map'] === 'foreign-plugin', 'Does not hijack another active plugin shortcode');
check(isset($GLOBALS['mdm_test_actions']['plugins_loaded']), 'Updater bootstraps for all WordPress management contexts');
check(count($GLOBALS['mdm_test_assets']['scripts']) === 1, 'One local enhancement script, no map library or CDN');
echo "$tests renderer checks passed.\n";
