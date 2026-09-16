import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const script = readFileSync(new URL('../assets/map.js', import.meta.url), 'utf8');
function mount() {
    const listeners = {}, attributes = {}, buttons = { in: {}, out: {}, reset: {} }, status = {};
    const controls = {
        hidden: true,
        querySelector: selector => selector === '.mdm-map-status' ? status : buttons[selector.match(/"(\w+)"/)[1]],
        addEventListener: (event, fn) => { listeners['controls-' + event] = fn; }
    };
    const svg = {
        setAttribute: (name, value) => { attributes[name] = value; },
        addEventListener: (event, fn) => { listeners[event] = fn; },
        getBoundingClientRect: () => ({ width: 1000, height: 560 }),
        setPointerCapture() {}, hasPointerCapture: () => true, releasePointerCapture() {}
    };
    const root = {
        dataset: {}, querySelector: selector => selector === '.mdm-map-svg' ? svg : controls,
        toggleAttribute: (name, value) => { attributes[name] = value; }
    };
    const timeouts = [];
    const context = { document: { querySelectorAll: () => [root] }, setTimeout: fn => timeouts.push(fn) };
    runInNewContext(script, context);
    const click = action => listeners['controls-click']({ target: { closest: () => ({ dataset: { mapAction: action } }) } });
    const key = value => { let prevented = false; listeners.keydown({ key: value, preventDefault: () => { prevented = true; } }); return prevented; };
    return { context, controls, attributes, buttons, status, listeners, click, key, timeouts };
}
test('Zoom is bounded, reset restores the full map, and controls announce state', () => {
    const m = mount();
    assert.equal(m.controls.hidden, false);
    assert.equal(m.buttons.out.disabled, true);
    assert.equal(m.attributes.viewBox, '0 0 1000 560');
    for (let i = 0; i < 20; i++) m.click('in');
    assert.equal(m.buttons.in.disabled, true);
    assert.match(m.status.textContent, /400 percent/);
    m.click('reset');
    assert.equal(m.attributes.viewBox, '0 0 1000 560');
    assert.equal(m.attributes['data-zoomed'], false);
    for (let i = 0; i < 20; i++) m.click('out');
    assert.equal(m.attributes.viewBox, '0 0 1000 560');
});
test('Keyboard zoom and pan work, and ordinary navigation keys are untouched', () => {
    const m = mount();
    assert.equal(m.key('Tab'), false);
    assert.equal(m.key('ArrowRight'), false);
    assert.equal(m.key('+'), true);
    const before = m.attributes.viewBox;
    assert.equal(m.key('ArrowRight'), true);
    assert.notEqual(m.attributes.viewBox, before);
    m.key('Escape');
    assert.equal(m.attributes.viewBox, '0 0 1000 560');
});
test('Drag pans but cannot accidentally follow a region; a normal click is untouched', () => {
    const m = mount();
    m.click('in');
    const before = m.attributes.viewBox;
    m.listeners.pointerdown({ pointerId: 1, button: 0, clientX: 500, clientY: 200 });
    m.listeners.pointermove({ pointerId: 1, clientX: 550, clientY: 210 });
    assert.notEqual(m.attributes.viewBox, before);
    m.listeners.pointerup({ pointerId: 1 });
    let prevented = false;
    m.listeners.click({ preventDefault: () => { prevented = true; }, stopPropagation() {} });
    assert.equal(prevented, true);
    prevented = false;
    m.listeners.click({ preventDefault: () => { prevented = true; }, stopPropagation() {} });
    assert.equal(prevented, false);
});
test('Duplicate script execution does not register duplicate behavior', () => {
    const m = mount();
    const listener = m.listeners['controls-click'];
    runInNewContext(script, m.context);
    assert.equal(m.listeners['controls-click'], listener);
});
