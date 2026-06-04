<?php

function base_path(string $path = ''): string
{
    $base = dirname(__DIR__, 2);
    if ($path === '') {
        return $base;
    }

    return $base . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
}

function redirect(string $url)
{
    return \Ziro\System\Http\Response::redirect($url);
}

function json(array $data, int $status = 200)
{
    return \Ziro\System\Http\Response::json($data, $status);
}

function to(string $url)
{
    return redirect($url);
}

function config(string $key, mixed $default = null): mixed
{
    return \Ziro\System\Config\Config::get($key, $default);
}

function asset_path(string $logicalPath): string
{
    return \Ziro\System\Assets\AssetManager::path($logicalPath);
}

function asset_url(string $logicalPath): string
{
    return \Ziro\System\Assets\AssetManager::url($logicalPath);
}

function asset_manifest(): array
{
    return \Ziro\System\Assets\AssetManager::manifest();
}

function frontend_runtime_config(): array
{
    return \Ziro\System\Assets\AssetManager::runtimeConfig();
}

