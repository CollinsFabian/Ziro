<?php

declare(strict_types=1);

namespace Ziro\System\Http;

class CorsPolicy
{
    public static function headers(Request $request): array
    {
        $allowCredentials = self::allowsCredentials();
        $origin = $request->origin();
        $resolvedOrigin = self::resolveAllowedOrigin($origin, $allowCredentials);

        $headers = [
            'Access-Control-Allow-Methods' => (string) config('APP_CORS_ALLOW_METHODS', 'GET, POST, PUT, PATCH, DELETE, OPTIONS'),
            'Access-Control-Allow-Headers' => (string) config('APP_CORS_ALLOW_HEADERS', 'Content-Type, Authorization, X-Api-Key, X-Requested-With'),
            'Access-Control-Max-Age' => (string) config('APP_CORS_MAX_AGE', '600'),
        ];

        if ($resolvedOrigin !== null) {
            $headers['Access-Control-Allow-Origin'] = $resolvedOrigin;
        }

        if ($allowCredentials && $resolvedOrigin !== null && $resolvedOrigin !== '*') {
            $headers['Access-Control-Allow-Credentials'] = 'true';
            $headers['Vary'] = 'Origin';
        }

        return $headers;
    }

    public static function allowsCredentials(): bool
    {
        return filter_var(config('APP_CORS_ALLOW_CREDENTIALS', 'false'), FILTER_VALIDATE_BOOL);
    }

    public static function resolveAllowedOrigin(?string $origin, bool $allowCredentials): ?string
    {
        $allowedOrigins = self::allowedOrigins();

        if ($allowedOrigins === ['*']) {
            return $allowCredentials ? null : '*';
        }

        if ($origin === null) {
            return null;
        }

        return in_array($origin, $allowedOrigins, true) ? $origin : null;
    }

    protected static function allowedOrigins(): array
    {
        $configured = (string) config('APP_CORS_ALLOWED_ORIGINS', config('APP_CORS_ALLOW_ORIGIN', '*'));
        $origins = array_values(array_filter(array_map(
            static fn(string $origin): string => trim($origin),
            explode(',', $configured)
        )));

        return $origins === [] ? ['*'] : $origins;
    }
}
