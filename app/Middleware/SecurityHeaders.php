<?php

namespace Ziro\Middleware;

use Ziro\System\Http\Request;
use Ziro\System\Http\Response;
use Ziro\System\Middleware\MiddlewareInterface;

class SecurityHeaders implements MiddlewareInterface
{
    public function handle(Request $request, callable $next)
    {
        $response = $next($request);

        if (!$response instanceof Response) {
            $response = is_array($response)
                ? Response::json($response)
                : new Response((string) $response);
        }

        return $response->withHeaders($this->headers());
    }

    protected function headers(): array
    {
        $connectSources = ["'self'"];

        if (config('APP_ENV', 'production') === 'local' && config('ASSET_HMR_ENABLED', 'false') === 'true') {
            $connectSources[] = (string) config('ASSET_HMR_URL', 'ws://localhost:3002');
        }

        return [
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'SAMEORIGIN',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'Permissions-Policy' => 'camera=(), microphone=(), geolocation=()',
            'Content-Security-Policy' => implode('; ', [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
                "font-src 'self' https://fonts.gstatic.com data:",
                "img-src 'self' data: https:",
                'connect-src ' . implode(' ', $connectSources),
                "frame-ancestors 'self'",
                "base-uri 'self'",
                "form-action 'self'",
            ]),
        ];
    }
}
