<?php require __DIR__ . '/wp-stubs.php'; ?>
<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>MDM Partner Map - local preview</title><link rel="stylesheet" href="/assets/map.css">
<style>body{margin:0;padding:40px 20px;background:#f5f7f8;font:17px/1.5 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:24px;background:white;border-radius:36px;box-shadow:0 8px 35px #0002}h1{text-align:center;color:#007b9d;margin:0 0 25px;font-size:40px}@media(max-width:600px){body{padding:10px}main{padding:14px;border-radius:20px}h1{font-size:30px}}</style>
<main><h1>Our Partners</h1><?php echo \StrongAnchor\MDMPartnerMap\render(); ?></main><script src="/assets/map.js"></script></html>
