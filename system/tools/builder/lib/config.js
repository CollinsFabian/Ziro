const baseConfig = require('../config/base');
const devConfig = require('../config/dev');
const prodConfig = require('../config/prod');
const { readEnv } = require('./env');

function createBuildConfig(mode) {
    const profile = mode === 'production' ? prodConfig : devConfig;
    const env = readEnv(baseConfig.root);

    return {
        ...profile,
        env,
        appName: env.APP_NAME || 'Ziro',
        apiBaseUrl: env.API_BASE_URL || '/api/v1',
        assetBaseUrl: env.ASSET_URL || '',
    };
}

module.exports = { createBuildConfig };
