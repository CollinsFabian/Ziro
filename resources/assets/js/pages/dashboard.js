import { bindHeaderInteractions, renderHeader } from "../components/header.js";
import { renderFooter } from "../components/footer.js";
import { loadTemplate } from "../core/template.js";
import { dom } from "../core/dom.js";
import { appName, assetUrl } from "../core/runtime.js";

const dashboardTemplatePath = assetUrl('templates/pages/dashboard.html');

async function renderDashboardShell() {
    const [header, dashboardPage, footer] = await Promise.all([
        renderHeader(appName()),
        loadTemplate(dashboardTemplatePath),
        renderFooter(),
    ]);

    return `${header}<main id="page-root">${dashboardPage}</main>${footer}`;
}

export async function mountDashboardPage() {
    const appShell = dom.id('app');
    const pageRoot = dom.id('page-root');

    if (!appShell) return () => {};

    dom.setDocTitle('Dashboard');

    if (pageRoot) {
        pageRoot.innerHTML = await loadTemplate(dashboardTemplatePath);
    } else {
        appShell.innerHTML = await renderDashboardShell();
    }

    dom.docBody.classList.remove('route-login');

    const cleanupHeader = bindHeaderInteractions();
    return () => {
        cleanupHeader();
    };
}
