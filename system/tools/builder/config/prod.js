const base = require('./base');

module.exports = {
    ...base,
    mode: 'production',
    minify: true,
    sourcemap: false,
    hmr: {
        ...base.hmr,
        enabled: false,
    },
};
