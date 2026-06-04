<?php

declare(strict_types=1);

namespace Ziro\Support;

class WebPageRenderer
{
    public function render(array $page): string
    {
        $appName = (string) config('APP_NAME', 'Ziro');
        $title = (string) ($page['title'] ?? $appName);
        $description = (string) ($page['description'] ?? 'Ziro framework application.');
        $path = (string) ($page['path'] ?? '/');
        $routeName = (string) ($page['route_name'] ?? '');
        $robots = (string) ($page['robots'] ?? 'index,follow');
        $status = (int) ($page['status'] ?? 200);
        $bodyClass = trim((string) ($page['body_class'] ?? ''));
        $content = (string) ($page['fallback_content'] ?? '');
        $canonicalUrl = $this->absoluteUrl($path);
        $runtimeConfig = json_encode(
            array_merge(frontend_runtime_config(), [
                'CURRENT_PATH' => $path,
                'CURRENT_ROUTE_NAME' => $routeName,
                'INITIAL_STATUS' => $status,
            ]),
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT
        );

        $escapedTitle = $this->escape($title);
        $escapedDescription = $this->escape($description);
        $escapedCanonicalUrl = $this->escape($canonicalUrl);
        $escapedAppName = $this->escape($appName);
        $escapedRobots = $this->escape($robots);
        $escapedBodyClass = $this->escape($bodyClass);

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$escapedTitle}</title>
    <meta name="description" content="{$escapedDescription}">
    <meta name="robots" content="{$escapedRobots}">
    <link rel="canonical" href="{$escapedCanonicalUrl}">
    <meta property="og:site_name" content="{$escapedAppName}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{$escapedTitle}">
    <meta property="og:description" content="{$escapedDescription}">
    <meta property="og:url" content="{$escapedCanonicalUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{$escapedTitle}">
    <meta name="twitter:description" content="{$escapedDescription}">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
    <link rel="stylesheet" href="{$this->escape(asset_url('assets/css/app.css'))}">
    <script defer src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script id="ziro-runtime-config">window.ZIRO_CONF = {$runtimeConfig};</script>
</head>
<body class="{$escapedBodyClass}" data-http-status="{$status}">
    <div id="app" data-route="{$this->escape($routeName)}" data-path="{$this->escape($path)}">{$content}</div>
    <noscript>
        <main class="not-found-shell">
            <section class="not-found-card container">
                <p class="eyebrow">JavaScript Required</p>
                <h1>This application needs JavaScript enabled.</h1>
                <p>The frontend is delivered as a SPA. Enable JavaScript to continue.</p>
            </section>
        </main>
    </noscript>
    <script type="module" src="{$this->escape(asset_url('assets/js/main.js'))}"></script>
</body>
</html>
HTML;
    }

    protected function absoluteUrl(string $path): string
    {
        $baseUrl = rtrim((string) config('APP_URL', 'http://localhost:8000'), '/');
        $normalizedPath = '/' . ltrim($path, '/');

        return $baseUrl . ($normalizedPath === '/' ? '/' : $normalizedPath);
    }

    protected function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }
}
