import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const script = readFileSync(new URL('../assets/map.js', import.meta.url), 'utf8');
function element(attributes = {}) {
    return {
        attributes, textContent: '', dataset: {},
        setAttribute: (name, value) => { attributes[name] = value; },
        removeAttribute: name => { delete attributes[name]; },
        getAttribute: name => attributes[name] ?? null,
        hasAttribute: name => Object.hasOwn(attributes, name)
    };
}
function mount() {
    const listeners = {}, windowListeners = {}, timers = new Map();
    const root = element(), svg = element(), status = element();
    const region = element({ href: '/north-america/', 'aria-label': 'North America partners' });
    const directory = element({ href: '/middle-east/' });
    directory.textContent = 'Middle East';
    root.querySelector = selector => selector === '.mdm-map-svg' ? svg : status;
    root.contains = link => link === region || link === directory;
    root.addEventListener = (event, fn) => { listeners[event] = fn; };
    let timerId = 0;
    const context = {
        document: { querySelectorAll: () => [root] },
        window: { addEventListener: (event, fn) => { windowListeners[event] = fn; } },
        setTimeout: (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id; },
        clearTimeout: id => timers.delete(id)
    };
    runInNewContext(script, context);
    function click(overrides = {}, link = region) {
        const event = {
            button: 0, target: { closest: () => link },
            preventDefault: () => assert.fail('Native navigation must never be cancelled'),
            stopPropagation: () => assert.fail('Click propagation must remain native'),
            ...overrides
        };
        listeners.click(event);
    }
    return { root, svg, status, region, directory, listeners, windowListeners, timers, context, click };
}
test('Region click shows feedback synchronously without intercepting navigation', () => {
    const m = mount();
    m.click();
    assert.equal(m.root.hasAttribute('data-loading'), true);
    assert.equal(m.svg.getAttribute('aria-busy'), 'true');
    assert.equal(m.region.hasAttribute('data-loading-link'), true);
    assert.equal(m.status.textContent, 'Loading North America partners…');
    assert.equal([...m.timers.values()][0].delay, 15000);
});
test('Keyboard Enter click and directory links receive the same feedback', () => {
    const m = mount();
    m.click({ detail: 0 }, m.directory);
    assert.equal(m.status.textContent, 'Loading Middle East…');
    assert.equal(m.directory.hasAttribute('data-loading-link'), true);
});
test('Modifier keys, non-primary buttons and cancelled clicks are untouched', () => {
    for (const event of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true },
        { altKey: true }, { button: 1 }, { button: 2 }, { defaultPrevented: true }]) {
        const m = mount();
        m.click(event);
        assert.equal(m.root.hasAttribute('data-loading'), false);
        assert.equal(m.status.textContent, '');
        assert.equal(m.timers.size, 0);
    }
});
test('New-window, download, missing-href, foreign and non-link targets are ignored', () => {
    for (const attrs of [{ target: '_blank' }, { target: 'named-window' }, { download: '' }, { href: '' }]) {
        const m = mount();
        Object.assign(m.region.attributes, attrs);
        m.click();
        assert.equal(m.root.hasAttribute('data-loading'), false);
    }
    const m = mount();
    m.click({}, null);
    m.click({}, element({ href: '/unrelated/' }));
    assert.equal(m.timers.size, 0);
});
test('Explicit self targets retain feedback', () => {
    const m = mount();
    m.region.setAttribute('target', '_self');
    m.click();
    assert.equal(m.root.hasAttribute('data-loading'), true);
});
test('Back/forward restore clears the previous indicator and pending timer', () => {
    const m = mount();
    m.click();
    m.windowListeners.pageshow({ persisted: true });
    assert.equal(m.root.hasAttribute('data-loading'), false);
    assert.equal(m.svg.hasAttribute('aria-busy'), false);
    assert.equal(m.region.hasAttribute('data-loading-link'), false);
    assert.equal(m.status.textContent, '');
    assert.equal(m.timers.size, 0);
});
test('Cancelled navigation recovers after timeout, and another click stays usable', () => {
    const m = mount();
    m.click();
    [...m.timers.values()][0].fn();
    assert.equal(m.root.hasAttribute('data-loading'), false);
    assert.equal(m.svg.hasAttribute('aria-busy'), false);
    assert.equal(m.region.hasAttribute('data-loading-link'), false);
    assert.equal(m.status.textContent, '');
    m.click({}, m.directory);
    assert.equal(m.status.textContent, 'Loading Middle East…');
});
test('A second choice replaces selection and has just one recovery timer', () => {
    const m = mount();
    m.click();
    m.click({}, m.directory);
    assert.equal(m.region.hasAttribute('data-loading-link'), false);
    assert.equal(m.directory.hasAttribute('data-loading-link'), true);
    assert.equal(m.timers.size, 1);
});
test('Duplicate script execution does not register duplicate behavior', () => {
    const m = mount();
    const listener = m.listeners.click;
    runInNewContext(script, m.context);
    assert.equal(m.listeners.click, listener);
});
test('No zoom or instruction UI remains; loading respects reduced motion', () => {
    const css = readFileSync(new URL('../assets/map.css', import.meta.url), 'utf8');
    assert.doesNotMatch(script, /pointerdown|pointermove|viewBox|data-map-action/);
    assert.doesNotMatch(css, /mdm-map-controls|mdm-map-help|touch-action:\s*none/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /animation: none/);
    assert.match(css, /pointer-events: none/);
});
