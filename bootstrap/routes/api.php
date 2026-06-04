<?php

/** @var \Ziro\System\Routing\Router $router */

use Ziro\Controllers\Api\AuthController;
use Ziro\Controllers\Api\UserController;

$router->get('/api/v1/user', [UserController::class, 'profile'])
    ->middleware(['rate_limit']);

$router->post('/api/v1/login', [AuthController::class, 'login'])
    ->middleware(['json_only', 'rate_limit']);

$router->post('/api/v1/logout', [AuthController::class, 'logout'])
    ->middleware(['json_only', 'api_key_auth', 'rate_limit']);
