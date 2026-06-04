const templateCache = new Map();

export async function loadTemplate(path) {
    if (!templateCache.has(path)) {
        const request = fetch(path).then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to load template: ${path}`);
            }

            return response.text();
        });

        templateCache.set(path, request);
    }

    return templateCache.get(path);
}

export function renderTemplate(template, data = {}) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
}
