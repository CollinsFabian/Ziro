<?php

declare(strict_types=1);

namespace Ziro\Controllers\Web;

use Ziro\Support\WebPageRenderer;
use Ziro\System\Http\Request;
use Ziro\System\Http\Response;

class SpaController
{
    public function __construct(protected WebPageRenderer $renderer) {}

    public function shell(Request $request): Response
    {
        return Response::html($this->renderer->render([
            'title' => (string) config('APP_NAME', 'Ziro'),
            'description' => 'A PHP backend framework with a modern asset pipeline, SPA integration, and cleaner separation between web UI and APIs.',
            'path' => $request->uri,
            'route_name' => 'spa-shell',
            'body_class' => $this->bodyClassForPath($request->uri),
        ]));
    }

    public function serverError(Request $request): Response
    {
        return Response::html($this->renderer->render([
            'title' => 'Server Error | ' . config('APP_NAME', 'Ziro'),
            'description' => 'The application encountered an internal error.',
            'path' => $request->uri,
            'route_name' => 'server-error',
            'robots' => 'noindex,nofollow',
            'status' => 500,
            'fallback_content' => <<<HTML
                <main class="not-found-shell">
                    <section class="not-found-card container">
                        <p class="eyebrow">500</p>
                        <h1>The application hit an internal error.</h1>
                        <p>Try again in a moment. If the problem keeps happening, check the runtime logs.</p>
                        <div class="cta">
                            <a href="/" class="btn primary">Back Home</a>
                            <a href="/login" class="btn ghost">Open Login</a>
                        </div>
                    </section>
                </main>
            HTML,
        ]), 500);
    }

    protected function bodyClassForPath(string $path): string
    {
        return $path === '/login' ? 'route-login' : '';
    }
}
