/* Progressive enhancement only: native links navigate immediately, even without JS. */
(() => {
    'use strict';
    document.querySelectorAll('[data-mdm-partner-map]').forEach(root => {
        const svg = root.querySelector('.mdm-map-svg');
        const status = root.querySelector('.mdm-map-loading-text');
        if (!svg || !status || root.dataset.ready) return;
        root.dataset.ready = 'true';
        let selected = null;
        let resetTimer;
        function reset() {
            clearTimeout(resetTimer);
            root.removeAttribute('data-loading');
            svg.removeAttribute('aria-busy');
            if (selected) selected.removeAttribute('data-loading-link');
            selected = null;
            status.textContent = '';
        }
        root.addEventListener('click', event => {
            // Preserve new-tab/window, download and already-cancelled click behavior.
            if (event.defaultPrevented || event.button !== 0 || event.ctrlKey ||
                event.metaKey || event.shiftKey || event.altKey) return;
            const link = event.target.closest('a.mdm-map-region, .mdm-map-directory a');
            if (!link || !root.contains(link) || !link.getAttribute('href') ||
                link.hasAttribute('download') ||
                (link.getAttribute('target') && link.getAttribute('target') !== '_self')) return;
            reset();
            selected = link;
            selected.setAttribute('data-loading-link', '');
            root.setAttribute('data-loading', '');
            // The live status is outside the busy SVG so its announcement is not deferred.
            svg.setAttribute('aria-busy', 'true');
            const label = (link.getAttribute('aria-label') || link.textContent).trim();
            status.textContent = label ? `Loading ${label}…` : 'Loading partners…';
            // Do not preventDefault, wait, or replace navigation. The href runs natively.
            // Recover if the visitor cancels loading; links remain usable throughout.
            resetTimer = setTimeout(reset, 15000);
        });
        // Back/forward cache restores the old DOM, including any loading state.
        window.addEventListener('pageshow', reset);
    });
})();
