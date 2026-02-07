/**
 * BigCommerce live bracket viewer bridge
 * Add this to the Script Manager (Footer, All Pages or Product Page)
 */
(function () {
    const VIEWER_IFRAME_ID = 'bracket-viewer-iframe';

    function getProductData() {
        const sku = document.querySelector('[data-product-sku]')?.innerText?.trim()
            || document.querySelector('.sku-section')?.innerText?.trim();

        const options = {};
        document.querySelectorAll('.productView-options select').forEach(select => {
            const label = select.closest('.form-field')?.querySelector('.form-label')?.innerText?.replace(':', '').trim();
            if (label) {
                options[label] = select.options[select.selectedIndex]?.text?.trim();
            }
        });

        return { sku, options };
    }

    function syncViewer() {
        const iframe = document.getElementById(VIEWER_IFRAME_ID);
        if (!iframe || !iframe.contentWindow) return;

        const data = getProductData();
        console.log('Shouting to viewer:', data);

        iframe.contentWindow.postMessage({
            type: 'BC_OPTION_CHANGE',
            ...data
        }, '*');
    }

    // Listen for changes
    document.addEventListener('change', (e) => {
        if (e.target.matches('.productView-options select')) {
            syncViewer();
        }
    });

    // Initial sync when viewer is ready
    window.addEventListener('message', (event) => {
        if (event.data.type === 'VIEWER_READY') {
            syncViewer();
        }
    });

    // Fallback periodic check if needed
    // setInterval(syncViewer, 2000);
})();
