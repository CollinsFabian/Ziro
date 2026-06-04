const { createBuildConfig } = require('./lib/config');
const { runDev } = require('./lib/pipeline');

const config = createBuildConfig('development');

runDev(config).catch((error) => {
    console.error(error);
    process.exit(1);
});
