import { loadTemplate, renderTemplate } from "../core/template.js";
import { dom } from "../core/dom.js";
import { appName, assetUrl } from "../core/runtime.js";

const headerTemplatePath = assetUrl('templates/components/header.html');

export async function renderHeader(title = appName()) {
    const template = await loadTemplate(headerTemplatePath);
    return renderTemplate(template, { title });
}

export function bindHeaderInteractions() {
    const nav = dom.select('.nav');
    const toggle = dom.select('.nav-toggle');
    const menu = dom.id('primary-nav');

    if (!nav || !toggle || !menu) return () => { };

    const closeMenu = () => {
        nav.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
        nav.classList.add('nav-open');
        toggle.setAttribute('aria-expanded', 'true');
    };

    const toggleMenu = () => {
        if (nav.classList.contains('nav-open')) {
            closeMenu();
            return;
        }

        openMenu();
    };

    const onToggleClick = () => toggleMenu();
    const onMenuClick = (event) => {
        if (event.target.closest('a')) closeMenu();
    };
    const onResize = () => {
        if (window.innerWidth > 900) closeMenu();
    };

    dom.on(toggle, 'click', onToggleClick);
    dom.on(menu, 'click', onMenuClick);
    dom.on(window, 'resize', onResize);

    return () => {
        dom.off(toggle, 'click', onToggleClick);
        dom.off(menu, 'click', onMenuClick);
        dom.off(window, 'resize', onResize);
    };
}
