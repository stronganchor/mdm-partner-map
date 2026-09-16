# Third-party components

- **Natural Earth geography:** public domain. Source: https://github.com/nvkelso/natural-earth-vector/blob/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_110m_admin_0_map_units.geojson . Terms: https://www.naturalearthdata.com/about/terms-of-use/ . Derived region SVG path data is included in `data/regions.json`; the original source is build-only.
- **Plugin Update Checker 5.7:** Copyright Janis Elsts, MIT. Source: https://github.com/YahnisElsts/plugin-update-checker/releases/tag/v5.7 . Full MIT notice is retained in `plugin-update-checker/license.txt`.
- **Development-only geometry tools:** d3-geo, d3-geo-projection, topojson-server, topojson-client and their transitive packages. Their versions are locked in `package-lock.json`, and their licenses remain in the installed development packages. No code from these packages is included in the frontend or WordPress deployment; the generated output is geographic data.

No MapGeo, Freemius or amCharts executable code is copied into this plugin.
