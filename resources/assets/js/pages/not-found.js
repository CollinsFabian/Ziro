import { bindHeaderInteractions, renderHeader } from "../components/header.js";
import { renderFooter } from "../components/footer.js";
import { loadTemplate } from "../core/template.js";
import { dom } from "../core/dom.js";
import { appName, assetUrl } from "../core/runtime.js";

const notFoundTemplatePath = assetUrl('templates/pages/not-found.html');

async function renderNotFoundShell() {
    const [header, page, footer] = await Promise.all([
        renderHeader(appName()),
        loadTemplate(notFoundTemplatePath),
        renderFooter(),
    ]);

    return `${header}<main id="page-root">${page}</main>${footer}`;
}

export async function mountNotFoundPage() {
    const appShell = dom.id('app');
    const pageRoot = dom.id('page-root');

    if (!appShell) return () => {};

    dom.setDocTitle('404 - Not Found');

    if (pageRoot) {
        pageRoot.innerHTML = await loadTemplate(notFoundTemplatePath);
    } else {
        appShell.innerHTML = await renderNotFoundShell();
    }

    dom.docBody.classList.remove('route-login');
    const cleanupHeader = bindHeaderInteractions();
    return () => {
        cleanupHeader();
    };
}
