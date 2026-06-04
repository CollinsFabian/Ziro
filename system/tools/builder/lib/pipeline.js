const crypto = require('crypto');
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const postcssImport = require('postcss-import');
const cssnano = require('cssnano');
const sass = require('sass');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const { copyDirectory, emptyDirectory, ensureDirectory } = require('./paths');
const { createManifestStore } = require('./manifest');

function hash(content) {
    return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

function assetRelativePath(type, filename) {
    return `assets/${type}/${filename}`.replace(/\\/g, '/');
}

function findExistingEntry(baseDir, candidates) {
    for (const candidate of candidates) {
        const fullPath = path.join(baseDir, candidate);
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }

    return null;
}

function createAliasPlugin(aliases) {
    return {
        name: 'ziro-alias',
        setup(build) {
            const entries = Object.entries(aliases);

            for (const [alias, target] of entries) {
                const exactFilter = new RegExp(`^${escapeRegex(alias)}$`);
                const nestedFilter = new RegExp(`^${escapeRegex(alias)}/`);

                build.onResolve({ filter: exactFilter }, () => ({ path: target }));
                build.onResolve({ filter: nestedFilter }, (args) => ({
                    path: path.join(target, args.path.slice(alias.length + 1)),
                }));
            }
        },
    };
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function loadOptionalPostCssPlugins(config) {
    const plugins = [postcssImport(), autoprefixer()];

    const tailwindConfigPath = path.join(config.root, 'system', 'tools', 'builder', 'tailwind.config.js');
    if (fs.existsSync(tailwindConfigPath)) {
        const tailwindcss = require('@tailwindcss/postcss');
        plugins.unshift(tailwindcss({ config: tailwindConfigPath }));
    }

    if (config.mode === 'production') {
        plugins.push(cssnano());
    }

    return plugins;
}

function buildRuntimeConfig(config) {
    return {
        APP_NAME: config.appName,
        ENV: config.env.APP_ENV || config.mode,
        DEBUG: String(config.env.APP_DEBUG || 'false') === 'true',
        API_BASE_URL: config.apiBaseUrl,
        ASSET_URL: config.assetBaseUrl,
        ASSET_BASE_PATH: '/assets',
        HMR: {
            enabled: Boolean(config.hmr.enabled),
            url: `ws://${config.hmr.host}:${config.hmr.port}`,
        },
    };
}

function assetPublicUrl(config, manifestStore, logicalPath) {
    const manifest = manifestStore.getAll();
    const normalized = logicalPath.replace(/^\/+/, '');
    const resolved = manifest[normalized] || normalized;
    const base = (config.assetBaseUrl || '').replace(/\/$/, '');

    if (base !== '') {
        return `${base}/${resolved}`.replace(/([^:]\/)\/+/g, '$1');
    }

    return `/${resolved}`.replace(/\/+/g, '/');
}

async function buildJavaScript(config, manifestStore) {
    const entryFile = findExistingEntry(config.sourceAssetsDir, config.entryPoints.js);
    if (!entryFile) {
        throw new Error('No JavaScript or TypeScript entry file found.');
    }

    const result = await esbuild.build({
        entryPoints: [entryFile],
        bundle: true,
        format: 'esm',
        minify: config.minify,
        sourcemap: config.sourcemap,
        write: false,
        outdir: config.outputAssetsDir,
        entryNames: 'js/main',
        assetNames: 'media/[name]-[hash]',
        resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        loader: {
            '.png': 'file',
            '.jpg': 'file',
            '.jpeg': 'file',
            '.gif': 'file',
            '.svg': 'file',
            '.webp': 'file',
            '.woff': 'file',
            '.woff2': 'file',
            '.ttf': 'file',
            '.otf': 'file',
            '.eot': 'file',
        },
        plugins: [createAliasPlugin(config.aliases)],
    });

    for (const outputFile of result.outputFiles) {
        const relativeOutputPath = path.relative(config.outputAssetsDir, outputFile.path).replace(/\\/g, '/');
        const extension = path.extname(relativeOutputPath);

        if (extension === '.js') {
            const finalRelativePath = config.mode === 'production'
                ? assetRelativePath('js', `main.${hash(outputFile.contents)}.js`)
                : assetRelativePath('js', 'main.js');
            fs.writeFileSync(path.join(config.publicDir, finalRelativePath), outputFile.contents);
            manifestStore.set('assets/js/main.js', finalRelativePath);
            continue;
        }

        if (extension === '.map') {
            if (config.sourcemap) {
                fs.writeFileSync(path.join(config.outputAssetsDir, 'js', 'main.js.map'), outputFile.contents);
            }

            continue;
        }

        const destination = path.join(config.outputAssetsDir, relativeOutputPath);
        ensureDirectory(path.dirname(destination));
        fs.writeFileSync(destination, outputFile.contents);
    }
}

async function buildStyles(config, manifestStore) {
    const sourcePath = findExistingEntry(config.sourceAssetsDir, config.entryPoints.css);
    if (!sourcePath) {
        return null;
    }

    let css = '';
    if (sourcePath.endsWith('.scss')) {
        css = sass.compile(sourcePath, {
            loadPaths: [path.join(config.sourceAssetsDir, 'css')],
            style: config.mode === 'production' ? 'compressed' : 'expanded',
        }).css;
    } else {
        css = fs.readFileSync(sourcePath, 'utf-8');
    }

    const result = await postcss(loadOptionalPostCssPlugins(config)).process(css, {
        from: sourcePath,
    });

    let finalFilename = 'app.css';
    if (config.mode === 'production') {
        finalFilename = `app.${hash(result.css)}.css`;
    }

    fs.writeFileSync(path.join(config.outputAssetsDir, 'css', finalFilename), result.css);
    manifestStore.set('assets/css/app.css', assetRelativePath('css', finalFilename));

    return assetRelativePath('css', finalFilename);
}

function copyStaticAssets(config) {
    for (const directory of config.copyDirectories) {
        const source = path.join(config.sourceAssetsDir, directory);
        const destination = path.join(config.outputAssetsDir, directory);

        emptyDirectory(destination);
        copyDirectory(source, destination);
    }
}

function injectRuntimeConfig(html, runtimeConfig) {
    const runtimeScript = `    <script id="ziro-runtime-config">window.ZIRO_CONF = ${JSON.stringify(runtimeConfig)};</script>`;

    if (/<\/head>/i.test(html)) {
        return html.replace(/<\/head>/i, `${runtimeScript}\n</head>`);
    }

    return `${runtimeScript}\n${html}`;
}

function buildIndexHtml(config, manifestStore) {
    if (!fs.existsSync(config.htmlTemplatePath)) {
        return;
    }

    let html = fs.readFileSync(config.htmlTemplatePath, 'utf-8');
    html = html.replaceAll('/assets/css/app.css', assetPublicUrl(config, manifestStore, 'assets/css/app.css'));
    html = html.replaceAll('/assets/js/main.js', assetPublicUrl(config, manifestStore, 'assets/js/main.js'));
    html = injectRuntimeConfig(html, buildRuntimeConfig(config));
    fs.writeFileSync(path.join(config.publicDir, 'index.html'), html);
}

function prepareOutput(config) {
    emptyDirectory(config.outputAssetsDir);

    for (const directory of config.assetDirectories) {
        ensureDirectory(path.join(config.outputAssetsDir, directory));
    }
}

async function runBuild(config) {
    const manifestStore = createManifestStore(config.manifestPath);
    manifestStore.reset();
    prepareOutput(config);
    copyStaticAssets(config);
    await buildStyles(config, manifestStore);
    await buildJavaScript(config, manifestStore);
    buildIndexHtml(config, manifestStore);
    manifestStore.write();
}

async function runDev(config) {
    const manifestStore = createManifestStore(config.manifestPath);
    manifestStore.reset();
    prepareOutput(config);
    copyStaticAssets(config);
    await buildStyles(config, manifestStore);
    await buildJavaScript(config, manifestStore);
    buildIndexHtml(config, manifestStore);
    manifestStore.write();

    const wss = new WebSocket.Server({ port: config.hmr.port });
    const send = (payload) => {
        for (const client of wss.clients) {
            if (client.readyState === 1) {
                client.send(JSON.stringify(payload));
            }
        }
    };

    chokidar.watch(path.join(config.sourceAssetsDir, 'css')).on('all', async () => {
        await buildStyles(config, manifestStore);
        manifestStore.write();
        send({ type: 'css', file: 'assets/css/app.css' });
    });

    chokidar.watch(path.join(config.sourceAssetsDir, 'templates')).on('all', () => {
        copyStaticAssets(config);
        send({ type: 'reload' });
    });

    chokidar.watch(path.join(config.sourceAssetsDir, 'images')).on('all', () => {
        copyStaticAssets(config);
        send({ type: 'reload' });
    });

    chokidar.watch(path.join(config.sourceAssetsDir, 'fonts')).on('all', () => {
        copyStaticAssets(config);
        send({ type: 'reload' });
    });

    chokidar.watch(path.join(config.resourcesDir, 'index.html')).on('all', () => {
        buildIndexHtml(config, manifestStore);
        send({ type: 'reload' });
    });

    const entryFile = findExistingEntry(config.sourceAssetsDir, config.entryPoints.js);
    if (!entryFile) {
        throw new Error('No JavaScript or TypeScript entry file found.');
    }

    const ctx = await esbuild.context({
        entryPoints: [entryFile],
        bundle: true,
        format: 'esm',
        sourcemap: true,
        minify: false,
        outfile: path.join(config.outputAssetsDir, 'js', 'main.js'),
        assetNames: 'assets/[name]-[hash]',
        resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        loader: {
            '.png': 'file',
            '.jpg': 'file',
            '.jpeg': 'file',
            '.gif': 'file',
            '.svg': 'file',
            '.webp': 'file',
            '.woff': 'file',
            '.woff2': 'file',
            '.ttf': 'file',
            '.otf': 'file',
            '.eot': 'file',
        },
        plugins: [createAliasPlugin(config.aliases)],
    });

    await ctx.watch();
    await ctx.serve({
        servedir: config.publicDir,
        port: 3001,
        host: 'localhost',
    });

    console.log(`Dev assets at http://localhost:3001`);
    console.log(`HMR server at ws://${config.hmr.host}:${config.hmr.port}`);
}

module.exports = {
    runBuild,
    runDev,
};
