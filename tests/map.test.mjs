import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const map = JSON.parse(readFileSync(new URL('../data/regions.json', import.meta.url)));
const partners = JSON.parse(readFileSync(new URL('../data/partners.json', import.meta.url)));

test('Exactly the 12 original partner destinations are present', () => {
    assert.equal(partners.length, 12);
    assert.equal(new Set(partners.map(p => p.id)).size, 12);
    assert.equal(new Set(partners.map(p => p.path)).size, 12);
    for (const p of partners) {
        assert.match(p.path, /^\/[a-z-]+\/$/);
        assert.equal(map.regions.filter(r => r.name === p.subregion).length, 1);
    }
});
test('Bundled SVG geometry is finite path data, never markup', () => {
    assert.equal(map.viewBox, '0 0 1000 560');
    assert.equal(map.projection, 'Miller');
    assert.equal(map.regions.length, 21);
    for (const region of map.regions) {
        assert.match(region.d, /^[MLZ0-9., -]+$/);
        assert.ok(region.d.length > 20);
        assert.ok(region.countries.length > 0);
    }
    assert.ok(!map.regions.some(r => r.name === 'Antarctica'));
});
test('Key country-to-region boundaries are preserved', () => {
    const r = name => map.regions.find(r => r.name === name).countries;
    assert.ok(r('Northern America').includes('United States of America') || r('Northern America').includes('United States'));
    assert.ok(r('Central America').includes('Mexico'));
    assert.ok(r('Southern Asia').includes('India'));
    assert.ok(r('Western Asia').includes('Turkey'));
    assert.ok(r('Western Europe').includes('France'));
    assert.ok(!r('Western Europe').includes('French Guiana'));
    assert.ok(r('South America').includes('French Guiana'));
    assert.ok(r('Eastern Asia').includes('China'));
});
test('Build input provenance and deterministic generated output', () => {
    const input = readFileSync(new URL('../tools/source-map-units.geojson', import.meta.url));
    assert.equal(createHash('sha256').update(input).digest('hex'), map.sourceSha256);
    const before = readFileSync(new URL('../data/regions.json', import.meta.url), 'utf8');
    execFileSync(process.execPath, ['tools/build-map.mjs'], { cwd: new URL('..', import.meta.url) });
    assert.equal(readFileSync(new URL('../data/regions.json', import.meta.url), 'utf8'), before);
});
test('Front-end enhancement has no request, HTML injection, or remote-script APIs', () => {
    const js = readFileSync(new URL('../assets/map.js', import.meta.url), 'utf8');
    assert.doesNotMatch(js, /innerHTML|outerHTML|\beval\b|\bfetch\b|XMLHttpRequest|document\.write|location\.(search|hash)/);
});
