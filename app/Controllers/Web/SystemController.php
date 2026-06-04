<?php

declare(strict_types=1);

namespace Ziro\Controllers\Web;

use Ziro\System\Http\Response;

class SystemController
{
    public function robots(): Response
    {
        $baseUrl = rtrim((string) config('APP_URL', 'http://localhost:8000'), '/');
        $body = "User-agent: *\nAllow: /\nSitemap: {$baseUrl}/sitemap.xml\n";

        return new Response($body, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    public function sitemap(): Response
    {
        $baseUrl = rtrim((string) config('APP_URL', 'http://localhost:8000'), '/');
        $routes = ['/', '/login'];

        $items = array_map(static function (string $route) use ($baseUrl): string {
            $loc = htmlspecialchars($baseUrl . ($route === '/' ? '/' : $route), ENT_QUOTES, 'UTF-8');
            return "<url><loc>{$loc}</loc></url>";
        }, $routes);

        $body = '<?xml version="1.0" encoding="UTF-8"?>'
            . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            . implode('', $items)
            . '</urlset>';

        return new Response($body, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }
}
