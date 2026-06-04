const path = require('path');

const root = path.resolve(__dirname, '../../../../');

module.exports = {
    root,
    resourcesDir: path.join(root, 'resources'),
    sourceAssetsDir: path.join(root, 'resources', 'assets'),
    publicDir: path.join(root, 'public'),
    outputAssetsDir: path.join(root, 'public', 'assets'),
    manifestPath: path.join(root, 'public', 'manifest.json'),
    htmlTemplatePath: path.join(root, 'resources', 'index.html'),
    entryPoints: {
        js: ['js/main.ts', 'js/main.js'],
        css: ['css/app.scss', 'css/app.css'],
    },
    assetDirectories: ['js', 'css', 'templates', 'images', 'fonts'],
    copyDirectories: ['templates', 'images', 'fonts'],
    aliases: {
        '@': path.join(root, 'resources', 'assets', 'js'),
        '@assets': path.join(root, 'resources', 'assets'),
        '@styles': path.join(root, 'resources', 'assets', 'css'),
        '@templates': path.join(root, 'resources', 'assets', 'templates'),
        '@images': path.join(root, 'resources', 'assets', 'images'),
        '@fonts': path.join(root, 'resources', 'assets', 'fonts'),
    },
    hmr: {
        host: 'localhost',
        port: 3002,
    },
};
