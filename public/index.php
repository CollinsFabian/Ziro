<?php

declare(strict_types=1);

use Ziro\System\Http\Request;
use Ziro\System\Http\Response;
use Ziro\System\Support\ErrorLogger;
use Ziro\Controllers\Web\SpaController;

$kernel = require __DIR__ . '/../bootstrap/app.php';
$request = Request::capture();

try {
    $response = $kernel->handle($request);
} catch (Throwable $exception) {
    ErrorLogger::logThrowable($exception);

    if ($request->expectsJson()) {
        $payload = [
            'status' => 'error',
            'message' => 'Application error',
        ];

        if (config('APP_DEBUG', 'false') === 'true') {
            $payload['detail'] = $exception->getMessage();
        }

        $response = Response::json($payload, 500);
    } else {
        /** @var SpaController $controller */
        $controller = (new Ziro\System\Container())->make(SpaController::class);
        $response = $controller->serverError($request);
    }
}

$response->send();
