const base = require('./base');

module.exports = {
    ...base,
    mode: 'development',
    minify: false,
    sourcemap: true,
    hmr: {
        ...base.hmr,
        enabled: true,
    },
};
