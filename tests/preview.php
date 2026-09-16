<?php
require __DIR__ . '/wp-stubs.php';
// Local-only slow response fixture; this file is excluded from every release ZIP.
if (isset($_GET['arrival'])) {
    sleep(8);
    if (isset($_GET['stay'])) {
        http_response_code(204);
        return;
    }
    echo '<!doctype html><html lang="en"><meta charset="utf-8"><title>Map navigation test</title><h1>Destination loaded</h1><p>Use Back to verify that the loading indicator clears.</p></html>';
    return;
}
$preview_map = \StrongAnchor\MDMPartnerMap\render();
if (isset($_GET['loading-test']) && in_array($_GET['loading-test'], ['1', 'stay'], true)) {
    $target = $_GET['loading-test'] === 'stay' ? '/tests/preview.php?stay=1&amp;arrival=' : '/tests/preview.php?arrival=';
    $preview_map = str_replace('https://missiondrivenministries.org/', $target, $preview_map);
}
?>
<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>MDM Partner Map - local preview</title><link rel="stylesheet" href="/assets/map.css">
<style>body{margin:0;padding:40px 20px;background:#f5f7f8;font:17px/1.5 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:24px;background:white;border-radius:36px;box-shadow:0 8px 35px #0002}h1{text-align:center;color:#007b9d;margin:0 0 25px;font-size:40px}@media(max-width:600px){body{padding:10px}main{padding:14px;border-radius:20px}h1{font-size:30px}}</style>
<main><h1>Our Partners</h1><?php echo $preview_map; ?></main><script src="/assets/map.js"></script></html>
