<?php

/** @var \Ziro\System\Routing\Router $router */

use Ziro\Controllers\Web\SystemController;

$router->get('/robots.txt', [SystemController::class, 'robots']);
$router->get('/sitemap.xml', [SystemController::class, 'sitemap']);
