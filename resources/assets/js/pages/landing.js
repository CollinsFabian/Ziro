import { bindHeaderInteractions, renderHeader } from '../components/header.js';
import { renderFooter } from '../components/footer.js';
import { loadTemplate } from '../core/template.js';
import { dom } from "../core/dom.js";
import { appName, assetUrl } from "../core/runtime.js";

const landingTemplatePath = assetUrl('templates/pages/landing.html');

async function renderLandingShell() {
    const [header, landingPage, footer] = await Promise.all([
        renderHeader(appName()),
        loadTemplate(landingTemplatePath),
        renderFooter(),
    ]);

    return `${header}<main id="page-root">${landingPage}</main>${footer}`;
}

export async function mountLandingPage() {
    const appShell = dom.id('app');
    const pageRoot = dom.id('page-root');

    if (!appShell) return () => { };

    dom.setDocTitle('Home | Ziro');

    if (pageRoot) {
        pageRoot.innerHTML = await loadTemplate(landingTemplatePath);
    } else {
        appShell.innerHTML = await renderLandingShell();
    }

    dom.docBody.classList.remove('route-login');

    if (typeof window.hljs !== 'undefined') {
        window.hljs.highlightAll();
    }

    const cleanups = [];
    cleanups.push(bindHeaderInteractions());
    const navLinks = dom.selectAll('.nav a[href^="#"]');
    const sections = dom.selectAll('section[id]');

    const onScroll = () => {
        let current = '';

        sections.forEach((section) => {
            if (window.scrollY >= section.offsetTop - 100) {
                current = section.id;
            }
        });

        navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${current}`);
        });
    };

    dom.on(window, 'scroll', onScroll);
    cleanups.push(() => dom.off(window, 'scroll', onScroll));
    onScroll();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.1 });

    dom.selectAll('.card, .step, pre').forEach((el) => {
        el.classList.add('reveal-ready');
        observer.observe(el);
    });
    cleanups.push(() => observer.disconnect());

    const codeEl = dom.select('.hero .code-block code');
    let typingTimer = null;
    if (codeEl) {
        const text = codeEl.textContent;
        codeEl.textContent = '';

        const type = (index = 0) => {
            if (index >= text.length) return;
            codeEl.textContent += text[index];
            typingTimer = window.setTimeout(() => type(index + 1), 20);
        };

        type();
        cleanups.push(() => {
            if (typingTimer) window.clearTimeout(typingTimer);
            codeEl.textContent = text;
        });
    }

    dom.selectAll('.btn').forEach((btn) => {
        const onClick = (event) => {
            const circle = dom.createEl('span');
            circle.className = 'ripple';

            const rect = btn.getBoundingClientRect();
            circle.style.left = `${event.clientX - rect.left}px`;
            circle.style.top = `${event.clientY - rect.top}px`;

            btn.appendChild(circle);
            window.setTimeout(() => circle.remove(), 500);
        };

        dom.on(btn, 'click', onClick);
        cleanups.push(() => dom.off(btn, 'click', onClick));
    });

    return () => cleanups.forEach((cleanup) => cleanup());
}
