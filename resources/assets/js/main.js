import { router } from "./core/router.js";
import { mountLandingPage } from "./pages/landing.js";
import { mountLoginPage } from "./pages/login.js";
import { mountDashboardPage } from "./pages/dashboard.js";
import { mountNotFoundPage } from "./pages/not-found.js";
import { initHmrClient } from "./core/internal/hmr-client.js";

router.get('/', async () => mountLandingPage());
router.get('/home/{slug1}', async () => mountLandingPage());
router.get('/login', async () => mountLoginPage());
router.get('/dashboard', async () => mountDashboardPage());
router.notFound(async () => mountNotFoundPage());

document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || link.target === '_blank') return;
    if (/^(mailto:|tel:|https?:)/.test(href)) return;

    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return;

    event.preventDefault();
    router.navigate(url.pathname);
});

router.init();
initHmrClient();
