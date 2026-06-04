import { loadTemplate } from "../core/template.js";
import { assetUrl } from "../core/runtime.js";

const footerTemplatePath = assetUrl('templates/components/footer.html');

export async function renderFooter() {
    return loadTemplate(footerTemplatePath);
}
