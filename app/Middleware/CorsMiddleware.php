<?php

namespace Ziro\Middleware;

use Ziro\System\Http\Request;
use Ziro\System\Http\Response;
use Ziro\System\Http\CorsPolicy;
use Ziro\System\Middleware\MiddlewareInterface;

class CorsMiddleware implements MiddlewareInterface
{
    public function handle(Request $request, callable $next)
    {
        $headers = $this->headers($request);

        if ($request->method === 'OPTIONS') {
            return Response::json(['status' => 'ok'], 200, $headers);
        }

        $response = $next($request);

        if (!$response instanceof Response) {
            $response = is_array($response)
                ? Response::json($response)
                : new Response((string) $response);
        }

        return $response->withHeaders($headers);
    }

    protected function headers(Request $request): array
    {
        return CorsPolicy::headers($request);
    }
}
