<?php

declare(strict_types=1);

namespace Ziro\System;

use Ziro\Middleware\Auth\ApiKeyAuth;
use Ziro\Middleware\Auth\JwtAuth;
use Ziro\Middleware\Auth\SessionAuth;
use Ziro\Middleware\CorsMiddleware;
use Ziro\Middleware\JsonOnly;
use Ziro\Middleware\RateLimit;
use Ziro\Middleware\SecurityHeaders;
use Ziro\Controllers\Web\SpaController;
use Ziro\System\Http\Request;
use Ziro\System\Http\Response;
use Ziro\System\Middleware\Pipeline;
use Ziro\System\Routing\Router;

class Kernel
{
    protected Router $router;
    protected Container $container;
    protected array $routeMiddleware = [
        "rate_limit" => RateLimit::class,
        "json_only" => JsonOnly::class,
        "cors" => CorsMiddleware::class,
        "jwt_auth" => JwtAuth::class,
        "api_key_auth" => ApiKeyAuth::class,
        "session_auth" => SessionAuth::class,
    ];
    protected array $globalMiddleware = [
        CorsMiddleware::class,
        SecurityHeaders::class,
    ];

    public function __construct($container = null)
    {
        $this->container = $container ?? new Container();
        $this->router = new Router($this->container);
    }

    public function getRouter(): Router
    {
        return $this->router;
    }

    public function getContainer(): Container
    {
        return $this->container;
    }

    public function middleware(array $middlewares): void
    {
        $this->routeMiddleware = $middlewares;
    }

    public function globalMiddleware(array $middlewares): void
    {
        $this->globalMiddleware = $middlewares;
    }

    public function registerRoutes(): void
    {
        $router = $this->router; // DI
        $routeFiles = [
            base_path('bootstrap/routes/web.php'),
            base_path('bootstrap/routes/api.php'),
        ];

        foreach ($routeFiles as $routesPath) {
            if (!file_exists($routesPath)) {
                throw new \RuntimeException('Route file not found: ' . $routesPath);
            }

            require $routesPath;
        }
    }

    public function handle(Request $request): Response
    {
        $route = $this->router->match($request);

        $middlewares = [];
        foreach ($this->globalMiddleware as $middleware) {
            $middlewares[] = $middleware;
        }

        if ($route) {
            foreach ($route['middleware'] as $m) {
                if (!isset($this->routeMiddleware[$m])) {
                    throw new \RuntimeException("Route middleware [$m] is not registered.");
                }

                $middlewares[] = $this->routeMiddleware[$m];
            }
        }

        $pipeline = new Pipeline($this->container);
        $result = $pipeline
            ->send($request)
            ->through($middlewares)
            ->then(function ($req) use ($route) {
                if (!$route) {
                    return $this->handleMissingRoute($req);
                }

                return $this->router->executeRoute($route, $req);
            });

        if ($result instanceof Response) {
            return $result;
        }

        if (is_array($result)) {
            return Response::json($result);
        }

        return new Response((string) $result);
    }

    protected function handleMissingRoute(Request $request): Response
    {
        if ($request->method === 'OPTIONS' && $request->isApiRequest()) {
            return new Response('', 204);
        }

        if ($request->expectsJson()) {
            return Response::json(['status' => 'error', 'message' => 'Route not found'], 404);
        }

        /** @var SpaController $controller */
        $controller = $this->container->make(SpaController::class);
        return $controller->shell($request);
    }
}
