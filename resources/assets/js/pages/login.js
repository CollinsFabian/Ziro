import { api } from "../services/api.js";
import { renderFooter } from "../components/footer.js";
import { loadTemplate, renderTemplate } from "../core/template.js";
import { dom } from "../core/dom.js";
import { assetUrl } from "../core/runtime.js";

const loginTemplatePath = assetUrl('templates/pages/login.html');

async function renderLoginPage(header = 'Login to your account') {
    const [loginTemplate, footer] = await Promise.all([
        loadTemplate(loginTemplatePath),
        renderFooter(),
    ]);

    return `${renderTemplate(loginTemplate, { header })}${footer}`;
}

export async function mountLoginPage() {
    const appShell = dom.id('app');
    if (!appShell) return () => { };

    dom.setDocTitle('Login');

    appShell.innerHTML = await renderLoginPage();
    dom.docBody.classList.add('route-login');

    const form = dom.id('login-form-element');
    const emailInput = dom.id('email');
    const passwordInput = dom.id('password');
    const status = dom.select('.form-status');

    if (!form || !emailInput || !passwordInput || !status) {
        return () => { };
    }

    const onSubmit = async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            status.textContent = 'Enter both email and password.';
            return;
        }

        status.textContent = 'Logging in...';

        try {
            const response = await api.post('/login', { email, password });

            status.textContent = response.message ?? 'Login request completed.';
        } catch (error) {
            status.textContent = error.message ?? 'Login failed.';
        }
    };

    dom.on(form, 'submit', onSubmit);

    return () => {
        dom.off(form, 'submit', onSubmit);
        dom.docBody.classList.remove('route-login');
    };
}
