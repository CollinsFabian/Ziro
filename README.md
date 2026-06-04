# Ziro

Ziro is a PHP-first API and SPA framework skeleton with a regulated project layout, a bundled asset pipeline, and a cleaner HTTP lifecycle.

## Architecture

Framework boundaries:

- `public/` is the only web root
- `bootstrap/app.php` builds the kernel
- `bootstrap/routes/api.php` owns API route definitions
- `app/` contains controllers, middleware, entities, and services
- `resources/assets/` contains frontend source files
- `system/tools/builder/` contains the asset compiler and build config
- `database/migrations/` is the migration target
- `storage/` holds cache, logs, and runtime files

Runtime flow:

- `Ziro\System\Http\Request` normalizes headers, query params, and JSON bodies
- `Ziro\System\Http\Response` returns response objects instead of terminating execution
- `Ziro\System\Kernel` runs global middleware, route middleware, then controller actions
- `Ziro\Middleware\CorsMiddleware` handles preflight and API CORS headers
- `Ziro\System\Assets\AssetManager` resolves manifest-backed asset paths and runtime frontend config

## Setup

Backend prerequisites:

- PHP `^8.0`
- `ext-pdo`
- `ext-mbstring`
- Composer

Install backend dependencies:

```console
composer install
```

Frontend prerequisites:

- Node.js 18+
- npm

Install builder dependencies:

```console
cd system/tools/builder
npm install
cd ../../..
```

Create `.env` from `.env.example` and define:

```dotenv
APP_NAME=Ziro
APP_URL=http://localhost:3000
APP_ENV=local
APP_DEBUG=false
API_BASE_URL=/api/v1

DB_PDO_DSN=mysql:host=127.0.0.1;dbname=ziro;charset=utf8mb4;port=3306
DB_USER=root
DB_NAME = xxx
DB_HOST = localhost
DB_PORT = 3306
DB_PASSWORD = xxx

ASSET_URL=
ASSET_HMR_ENABLED=true
ASSET_HMR_URL=ws://localhost:3002

APP_JWT_SECRET=replace-me
APP_API_KEYS=abc1234,rxyz789

APP_CORS_ALLOW_ORIGIN=*
APP_CORS_ALLOW_METHODS=GET, POST, PUT, PATCH, DELETE, OPTIONS
APP_CORS_ALLOW_HEADERS=Content-Type, Authorization, X-Api-Key, X-Requested-With
APP_CORS_ALLOW_CREDENTIALS=true
APP_CORS_MAX_AGE=600
```

## Development

Start the PHP server:

```console
zi serve
```

That serves:

- `/api/*` through `public/index.php`
- static assets from `public/`
- SPA routes through `public/index.html`

Run the asset pipeline in watch mode:

```console
zi build:assets --dev
```

Build assets once:

```console
zi build:assets
```

Build production assets with hashed filenames:

```console
zi build:assets --prod
```

Low-level npm scripts still exist, but they are implementation details for the builder. The preferred framework interface is the `zi` launcher.

## Asset System

Ziro now follows a more conventional framework asset model:

- source assets live in `resources/assets/`
- browser-ready output is emitted to `public/assets/`
- production builds emit hashed filenames for primary JS and CSS entries
- `public/manifest.json` maps logical asset names to emitted files

Source layout:

- `resources/assets/js`
- `resources/assets/css`
- `resources/assets/templates`
- `resources/assets/images`
- `resources/assets/fonts`

Output layout:

- `public/assets/js`
- `public/assets/css`
- `public/assets/templates`
- `public/assets/images`
- `public/assets/fonts`

## Asset Helpers

PHP helpers:

- `asset_path('assets/js/main.js')`
- `asset_url('assets/js/main.js')`
- `asset_manifest()`
- `frontend_runtime_config()`

These are backed by `Ziro\System\Assets\AssetManager` and use `public/manifest.json` in production.

## Builder Features

The asset builder now includes:

- hashed filenames in production
- manifest generation
- environment-aware runtime config injection into `public/index.html`
- alias/import resolution:
  - `@`
  - `@assets`
  - `@styles`
  - `@templates`
  - `@images`
  - `@fonts`
- image/font directory handling
- separate base/dev/prod builder configs
- HMR runtime client integration
- PostCSS pipeline
- optional SCSS entry support through `resources/assets/css/app.scss`
- Tailwind PostCSS integration through `system/tools/builder/tailwind.config.js`

## Regulated Structure

Validate framework layout:

```console
zi structure:validate
```

The validator enforces required framework paths and rejects legacy misuse such as placing route definitions under `app/Routes`.
The validator enforces required framework paths and rejects legacy misuse such as keeping API routes in `app/Routes/api.php`.

Canonical locations:

- API routes: `bootstrap/routes/api.php`
- bootstrap: `bootstrap/app.php`
- migrations: `database/migrations`
- cache: `storage/cache`
- logs: `storage/logs`
- frontend sources: `resources/`
- compiled assets: `public/`

## Obsolete Patterns

These older conventions should be treated as obsolete:

- PHP `^7.4 || ^8.0` in older docs. The actual framework requirement is PHP `^8.0`.
- Defining API routes in `app/Routes/api.php`. The canonical route file is `bootstrap/routes/api.php`.
- Using `php system/core/CLI/zi.php ...` as the primary workflow in documentation. The preferred project-root interface is `zi ...`.
- Using `npm run dev`, `npm run build`, or `npm run build:prod` as the primary framework workflow. The preferred interface is `zi build:assets ...`.
- Returning framework responses by directly exiting from helpers or middleware. Controllers and middleware should return `Response` objects.

## Backend Best Practices

The backend was tightened around these rules:

- controllers receive `Request` instead of reading globals directly
- middleware returns `Response` objects instead of calling `exit`
- JWT verification uses structured parsing and constant-time signature checks
- API keys and CORS behavior come from configuration
- route definitions are separated from application classes

## CORS

Ziro now includes explicit CORS middleware for browser and third-party clients.

This covers:

- origin policy
- allowed methods
- allowed headers
- credential support
- preflight `OPTIONS` requests

All CORS behavior is configured from `.env`.

## Error Logging

Framework-managed PHP errors and uncaught exceptions are written to:

- `storage/logs/php-error.log`

The bootstrap configures:

- `log_errors=1`
- `error_log=storage/logs/php-error.log`
- exception logging for uncaught throwables
- fatal shutdown logging for parse/runtime fatal errors

Use `APP_DEBUG=true` in `.env` if you want PHP error display enabled during development.

## Build System

The frontend pipeline compiles `resources/assets/` into `public/assets/`:

1. JavaScript is bundled with `esbuild`
2. CSS is compiled from `app.scss` or `app.css`
3. PostCSS runs import handling, Tailwind integration, autoprefixing, and production minification
4. templates, images, and fonts are copied into `public/assets`
5. `manifest.json` records emitted entry assets
6. `public/index.html` receives runtime config injection and production asset resolution

## Production Routing

Production should preserve the same split:

- `/api/*` -> `public/index.php`
- existing files -> serve directly
- other routes -> `public/index.html`

Nginx example:

```nginx
location /api/ {
    try_files $uri /index.php?$query_string;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

See [`nginx.conf.example`](./system/deploy/nginx.conf.example).

## CLI

```console
zi serve
zi build:assets --dev
zi build:assets --prod
zi make:controller UserController
zi make:model User
zi make:migration create_users_table
zi cache:clear
zi structure:validate
```

## Route Example

```php
use Ziro\Controllers\Api\AuthController;
use Ziro\Controllers\Api\UserController;

$router->get('/api/v1/user', [UserController::class, 'profile'])
    ->middleware(['rate_limit']);

$router->post('/api/v1/login', [AuthController::class, 'login'])
    ->middleware(['json_only', 'rate_limit']);
```

## License

MIT
