import { useState, useEffect } from 'react';

export const useBigCommerce = () => {
    const [sku, setSku] = useState<string>('');
    const [options, setOptions] = useState<Record<string, any>>({});

    useEffect(() => {
        // 1. Check URL for initial data
        const urlParams = new URLSearchParams(window.location.search);
        const initialSku = urlParams.get('sku');
        console.log('[Viewer] Checking URL for SKU:', initialSku);

        if (initialSku) {
            setSku(initialSku);
        } else {
            // DEFAULT FOR TESTING
            console.log('[Viewer] No SKU in URL, using default JHCB10 for demo');
            setSku('JHCB10');
        }

        // 2. Listen for messages from BigCommerce parent window
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'BC_OPTION_CHANGE') {
                const { sku: newSku, options: newOptions } = event.data;
                console.log('[Viewer] Received message from BC:', { newSku, newOptions });
                if (newSku) setSku(newSku);
                if (newOptions) setOptions(newOptions);
            }
        };

        window.addEventListener('message', handleMessage);

        // Notify parent that we are ready
        console.log('[Viewer] Notifying parent ready');
        window.parent.postMessage({ type: 'VIEWER_READY' }, '*');

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return { sku, options };
};
