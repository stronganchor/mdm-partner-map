# MDM Partner Map

A deliberately small, site-specific WordPress plugin for Mission Driven Ministries. It renders the existing twelve partner-region links using bundled Natural Earth geography in a Miller projection. No MapGeo/amCharts runtime, map account, API key, remote map scripts, tracking, public AJAX/REST endpoint, or database migration is required.

## Use and editing

Place `[mdm_partner_map]` in the homepage Elementor Shortcode widget. Region links also appear in an expandable keyboard/touch-friendly directory. Links and the map work without JavaScript. The optional local script immediately highlights the selected region and shows a loading spinner while the browser opens its destination. It does not intercept or delay native navigation. Modified/new-tab clicks are unchanged, returning with Back clears the indicator, and it resets after 15 seconds if navigation was cancelled. Reduced-motion preferences disable the spinner animation. The full map remains visible without zoom controls or introductory instructions.

The current twelve destinations and labels are intentionally fixed in `data/partners.json`, matching the site's original map. Edit that reviewed source and ship a versioned update when a partner region changes; the linked partner pages remain editable normally in WordPress/Elementor. There is no arbitrary-HTML map editor. All labels, paths and SVG attributes are escaped at output. Request parameters and shortcode attributes do not control the map.

Old `[display-map id="999"]` and `[display-igmap id="999"]` shortcodes are supported only if another plugin has not already registered them. No other map ID is supported. These aliases preserve old revisions, not a dependency on MapGeo. The existing `igmap` post may be retained for rollback; the new plugin never reads it.

## Build and test

Requires Node 20+ and PHP 7.4+. Build-time geometry tools are development dependencies only and are not shipped to WordPress.

```sh
npm ci --ignore-scripts
npm run build
npm test
php -l mdm-partner-map.php
php tests/render.php
php -S 127.0.0.1:8765
# Preview: http://127.0.0.1:8765/tests/preview.php
```

The checked-in `data/regions.json` is generated from the public-domain Natural Earth 1:110m map-unit source at commit `ca96624a56bd078437bca8184e78163e5039ad19` of `nvkelso/natural-earth-vector`, grouped by geographic subregion (so, for example, French Guiana stays in South America rather than Western Europe). The build records the input SHA-256. Low-resolution coastlines differ slightly from the old map and are not a statement about political boundaries. Antarctica is omitted, as before. No third-party map JavaScript executes on visitors' devices.

## Releases and maintenance

Stable slug/repository/folder: `mdm-partner-map`. Bootstrap Plugin Update Checker 5.7 on `plugins_loaded`, track GitHub `main`, use releases with an asset named `mdm-partner-map-vX.Y.Z.zip`. No site GitHub token is required for this public repository.

For releases, bump the plugin header, `VERSION`, `readme.txt`, `package.json`, and lockfile root versions; run all tests; review changes; commit, push, tag, and publish a release. Package only `mdm-partner-map.php`, `assets/`, `data/`, `plugin-update-checker/`, `readme.txt`, `README.md`, `LICENSE`, and `THIRD-PARTY.md` under one `mdm-partner-map/` folder. Never package `node_modules`, tools, tests, CI files, or local deployment evidence. The update checker's full vendor source/license is retained.

For loading-feedback browser QA, append `?loading-test=1` to the local preview URL for an eight-second destination response, or `?loading-test=stay` for an eight-second HTTP 204 response that leaves the map visible for spinner inspection. Check desktop/mobile layout, keyboard activation, Back recovery, and the 15-second cancelled-navigation reset. These fixtures never ship to production.

Review dependency advisories during regular repository security checks. Upgrade the bundled update checker deliberately and retest. The runtime map has no dependency on the Node build packages.

## Live replacement and rollback

Before deployment, preserve an owner-private archive of the old plugin plus exact homepage content, Elementor metadata, active-plugin list, map data and relevant options. Check site health, locks and concurrent migration work. Install/lint this plugin, activate it, replace only map 999's exact homepage shortcode, deactivate and move the old plugin outside the webroot, and purge the active page cache. Keep old map data intact. Verify live files against the release, all region URLs, desktop/mobile/keyboard behavior, no-JS fallback, public routes, and absence of old assets/vendor code.

Rollback is coordinated with the private site-specific deployment record: restore the old folder and saved homepage fields, deactivate this plugin, reactivate the former plugin and purge cache. The old version has a known unresolved advisory, so rollback restores functionality but also restores that risk. Do not silently use it as a permanent resolution. No uninstall hook deletes site data.
