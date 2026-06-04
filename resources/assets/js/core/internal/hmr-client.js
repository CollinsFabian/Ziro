export function initHmrClient() {
    const config = window.ZIRO_CONF?.HMR;
    if (!config?.enabled || !config.url) {
        return;
    }

    try {
        const ws = new WebSocket(config.url);

        ws.onmessage = (event) => {
            const payload = JSON.parse(event.data);

            if (payload.type === 'css') {
                document.querySelectorAll('link[rel=stylesheet]').forEach((link) => {
                    const href = new URL(link.href);
                    if (!href.pathname.endsWith('/app.css')) {
                        return;
                    }

                    link.href = `${href.pathname}?t=${Date.now()}`;
                });
                return;
            }

            if (payload.type === 'reload' || payload.type === 'js') {
                window.location.reload();
            }
        };
    } catch (error) {
        console.error('Failed to initialize Ziro HMR client:', error);
    }
}
