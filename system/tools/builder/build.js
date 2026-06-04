const { createBuildConfig } = require('./lib/config');
const { runBuild } = require('./lib/pipeline');

const config = createBuildConfig(process.argv.includes('--prod') ? 'production' : 'development');

console.log(config.mode === 'production' ? 'Building (production)...' : 'Building (development)...');

runBuild(config)
    .then(() => {
        console.log('Build complete');
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
