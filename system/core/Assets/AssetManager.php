<?php

declare(strict_types=1);

namespace Ziro\System\Assets;

class AssetManager
{
    protected static ?array $manifest = null;

    public static function manifest(): array
    {
        if (self::$manifest !== null) {
            return self::$manifest;
        }

        $manifestPath = base_path('public/manifest.json');
        if (!is_file($manifestPath)) {
            return self::$manifest = [];
        }

        $decoded = json_decode((string) file_get_contents($manifestPath), true);
        return self::$manifest = is_array($decoded) ? $decoded : [];
    }

    public static function path(string $logicalPath): string
    {
        $normalized = ltrim(str_replace('\\', '/', $logicalPath), '/');
        $manifest = self::manifest();

        return $manifest[$normalized] ?? $normalized;
    }

    public static function url(string $logicalPath): string
    {
        $assetBaseUrl = rtrim((string) config('ASSET_URL', ''), '/');
        $resolvedPath = self::path($logicalPath);

        if ($assetBaseUrl !== '') {
            return $assetBaseUrl . '/' . ltrim($resolvedPath, '/');
        }

        return '/' . ltrim($resolvedPath, '/');
    }

    public static function runtimeConfig(): array
    {
        $hmrEnabled = config('APP_ENV', 'production') === 'local' && config('ASSET_HMR_ENABLED', 'false') === 'true';

        return [
            'APP_NAME' => (string) config('APP_NAME', 'Ziro'),
            'ENV' => (string) config('APP_ENV', 'production'),
            'DEBUG' => config('APP_DEBUG', 'false') === 'true',
            'ASSET_URL' => rtrim((string) config('ASSET_URL', ''), '/'),
            'ASSET_BASE_PATH' => '/assets',
            'API_BASE_URL' => (string) config('API_BASE_URL', '/api/v1'),
            'HMR' => [
                'enabled' => $hmrEnabled,
                'url' => (string) config('ASSET_HMR_URL', 'ws://localhost:3002'),
            ],
        ];
    }
}
