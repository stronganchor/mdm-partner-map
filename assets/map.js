/* Progressive enhancement only: every region link works without JavaScript. */
(() => {
    'use strict';
    document.querySelectorAll('[data-mdm-partner-map]').forEach(root => {
        const svg = root.querySelector('.mdm-map-svg');
        const controls = root.querySelector('.mdm-map-controls');
        if (!svg || !controls || root.dataset.ready) return;
        root.dataset.ready = 'true';
        let zoom = 1;
        let center = [500, 280];
        let drag = null;
        let suppressClick = false;
        function draw() {
            const width = 1000 / zoom;
            const height = 560 / zoom;
            center[0] = Math.max(width / 2, Math.min(1000 - width / 2, center[0]));
            center[1] = Math.max(height / 2, Math.min(560 - height / 2, center[1]));
            svg.setAttribute('viewBox', `${center[0] - width / 2} ${center[1] - height / 2} ${width} ${height}`);
            root.toggleAttribute('data-zoomed', zoom > 1);
            controls.querySelector('[data-map-action="out"]').disabled = zoom === 1;
            controls.querySelector('[data-map-action="in"]').disabled = zoom === 4;
            controls.querySelector('.mdm-map-status').textContent = `Map zoom ${Math.round(zoom * 100)} percent. ${zoom > 1 ? 'Drag the map to move around.' : ''}`;
        }
        function change(action) {
            if (action === 'reset') { zoom = 1; center = [500, 280]; }
            if (action === 'in') zoom = Math.min(4, zoom * 1.5);
            if (action === 'out') zoom = Math.max(1, zoom / 1.5);
            draw();
        }
        controls.addEventListener('click', event => {
            const button = event.target.closest('[data-map-action]');
            if (button) change(button.dataset.mapAction);
        });
        svg.addEventListener('keydown', event => {
            if (event.key === '+' || event.key === '=') { event.preventDefault(); change('in'); }
            if (event.key === '-') { event.preventDefault(); change('out'); }
            if (event.key === 'Escape' || event.key === '0') { event.preventDefault(); change('reset'); }
            const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
            if (zoom > 1 && moves[event.key]) {
                event.preventDefault();
                center = center.map((value, i) => value + moves[event.key][i] * 80 / zoom);
                draw();
            }
        });
        svg.addEventListener('pointerdown', event => {
            if (zoom <= 1 || event.button !== 0) return;
            drag = { id: event.pointerId, x: event.clientX, y: event.clientY, center: [...center], moved: false };
        });
        svg.addEventListener('pointermove', event => {
            if (!drag || drag.id !== event.pointerId) return;
            const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
            if (!drag.moved && Math.hypot(dx, dy) < 6) return;
            drag.moved = true;
            svg.setPointerCapture(event.pointerId);
            const box = svg.getBoundingClientRect();
            center = [drag.center[0] - dx * 1000 / (box.width * zoom), drag.center[1] - dy * 560 / (box.height * zoom)];
            draw();
        });
        function stop(event) {
            if (!drag || drag.id !== event.pointerId) return;
            suppressClick = drag.moved;
            drag = null;
            if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
            // Prevent only the synthetic click following this drag, not a future keyboard click.
            if (suppressClick) setTimeout(() => { suppressClick = false; }, 0);
        }
        svg.addEventListener('pointerup', stop);
        svg.addEventListener('pointercancel', stop);
        svg.addEventListener('pointerleave', event => { if (drag && !drag.moved) stop(event); });
        svg.addEventListener('click', event => {
            if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
        }, true);
        controls.hidden = false;
        draw();
    });
})();
