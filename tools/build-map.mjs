import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { geoPath } from 'd3-geo';
import { geoMiller } from 'd3-geo-projection';
import { topology } from 'topojson-server';
import { merge } from 'topojson-client';

const source = readFileSync(new URL('../tools/source-map-units.geojson', import.meta.url));
const collection = JSON.parse(source);
collection.features = collection.features.filter(f => f.properties.SUBREGION !== 'Antarctica');
const topo = topology({ countries: collection }, 100000);
const groups = new Map();
for (const geometry of topo.objects.countries.geometries) {
  const name = geometry.properties.SUBREGION;
  if (!groups.has(name)) groups.set(name, []);
  groups.get(name).push(geometry);
}
const projection = geoMiller().fitExtent([[12, 12], [988, 548]], collection);
const path = geoPath(projection).digits(2);
const regions = [...groups].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([name, geometries]) => {
  const shape = merge(topo, geometries);
  return { name, d: path(shape), countries: geometries.map(g => g.properties.NAME).sort() };
});
const result = {
  viewBox: '0 0 1000 560',
  projection: 'Miller',
  source: 'Natural Earth 1:110m admin-0 map units, public domain',
  sourceCommit: 'ca96624a56bd078437bca8184e78163e5039ad19',
  sourceSha256: createHash('sha256').update(source).digest('hex'),
  regions
};
writeFileSync(new URL('../data/regions.json', import.meta.url), JSON.stringify(result) + '\n');
console.log(`Built ${regions.length} bundled regions; no runtime mapping dependency.`);
