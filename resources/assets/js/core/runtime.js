export function runtimeConfig() {
    return window.ZIRO_CONF || {};
}

export function appName() {
    return runtimeConfig().APP_NAME || 'Ziro';
}

export function appEnv() {
    return runtimeConfig().ENV || 'production';
}

export function isDevelopmentEnv() {
    return ['local', 'development', 'dev'].includes(String(appEnv()).toLowerCase());
}

export function apiBaseUrl() {
    return runtimeConfig().API_BASE_URL || '/api/v1';
}

export function assetBaseUrl() {
    return runtimeConfig().ASSET_URL || '';
}

export function assetUrl(logicalPath) {
    const normalized = String(logicalPath || '').replace(/^\/+/, '');
    const base = assetBaseUrl().replace(/\/$/, '');
    const publicPath = `${runtimeConfig().ASSET_BASE_PATH || '/assets'}/${normalized}`.replace(/\/+/g, '/');

    return base ? `${base}${publicPath}` : publicPath;
}

export function currentPath() {
    return runtimeConfig().CURRENT_PATH || window.location.pathname;
}

export function currentRouteName() {
    return runtimeConfig().CURRENT_ROUTE_NAME || '';
}

export function initialStatus() {
    return Number(runtimeConfig().INITIAL_STATUS || 200);
}
