export class Router {
    constructor() {
        this.routes = [];
        this.currentRoute = null;
        this.currentCleanup = null;
        this.notFoundHandler = null;
        window.addEventListener('popstate', () => this.resolve());
    }

    get(path, handler) {
        this.routes.push({
            path,
            handler,
            matcher: this.compilePath(path),
        });
    }

    navigate(path) {
        if (path !== location.pathname) {
            history.pushState({}, '', path);
        }

        this.resolve();
    }

    async resolve() {
        const path = location.pathname;
        const match = this.match(path);

        if (!match) {
            if (typeof this.notFoundHandler === 'function') {
                if (typeof this.currentCleanup === 'function') {
                    this.currentCleanup();
                }

                this.currentRoute = null;
                this.currentCleanup = await this.notFoundHandler({
                    path,
                    params: {},
                });
            }

            console.error('404 returned route:', path);
            return;
        }

        if (typeof this.currentCleanup === 'function') {
            this.currentCleanup();
        }

        this.currentRoute = match.route;
        this.currentCleanup = await match.route.handler({
            path,
            params: match.params,
        });
    }

    init() {
        this.resolve();
    }

    notFound(handler) {
        this.notFoundHandler = handler;
    }

    match(path) {
        for (const route of this.routes) {
            const result = path.match(route.matcher);
            if (!result) continue;

            return {
                route,
                params: result.groups ?? {},
            };
        }

        return null;
    }

    compilePath(path) {
        const normalized = path.replace(/\/+$/, '') || '/';
        const pattern = normalized === '/'
            ? '^/$'
            : '^' + normalized.replace(/\{(\w+)\}/g, '(?<$1>[^/]+)') + '/?$';

        return new RegExp(pattern);
    }
}

export const router = new Router();
