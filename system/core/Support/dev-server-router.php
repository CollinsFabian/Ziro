<?php

declare(strict_types=1);

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH) ?: '/';
$publicPath = realpath(__DIR__ . '/../../../public');

if ($publicPath === false) {
    http_response_code(500);
    echo 'Public directory not found';
    return true;
}

$resolvedPath = realpath($publicPath . DIRECTORY_SEPARATOR . ltrim($path, '/'));
$isPublicFile = $resolvedPath !== false
    && str_starts_with($resolvedPath, $publicPath)
    && is_file($resolvedPath);

if ($isPublicFile) {
    return false;
}

require $publicPath . DIRECTORY_SEPARATOR . 'index.php';
return true;
