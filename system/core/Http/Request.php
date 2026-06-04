<?php

declare(strict_types=1);

namespace Ziro\System\Http;

class Request
{
    public string $method;
    public string $uri;
    public array $query = [];
    public array $body = [];
    public array $headers = [];
    public array $server = [];
    public string $rawBody = '';

    public static function capture(): self
    {
        $instance = new self();

        $instance->server = $_SERVER;
        $instance->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $instance->headers = self::captureHeaders();
        $instance->query = $_GET;
        $instance->rawBody = (string) file_get_contents('php://input');
        $instance->body = self::parseBody($instance->method, $instance->headers, $instance->rawBody);

        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        if (($pos = strpos($uri, "?")) !== false) $uri = substr($uri, 0, $pos);
        $uri = str_replace('/public/index.php', '', $uri);

        $instance->uri = rtrim($uri, '/') ?: '/';
        return $instance;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        if (array_key_exists($key, $this->body)) {
            return $this->body[$key];
        }

        return $this->query[$key] ?? $default;
    }

    public function header(string $key, mixed $default = null): mixed
    {
        $lookup = strtolower($key);

        foreach ($this->headers as $name => $value) {
            if (strtolower($name) === $lookup) {
                return $value;
            }
        }

        return $default;
    }

    public function isApiRequest(): bool
    {
        return str_starts_with($this->uri, '/api/');
    }

    public function expectsJson(): bool
    {
        if ($this->isApiRequest()) {
            return true;
        }

        $accept = strtolower((string) $this->header('Accept', ''));
        if (str_contains($accept, 'application/json')) {
            return true;
        }

        return strtolower((string) $this->header('X-Requested-With', '')) === 'xmlhttprequest';
    }

    public function origin(): ?string
    {
        $origin = $this->header('Origin');
        if (!is_string($origin) || trim($origin) === '') {
            return null;
        }

        return trim($origin);
    }

    protected static function captureHeaders(): array
    {
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            return is_array($headers) ? $headers : [];
        }

        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (!str_starts_with($key, 'HTTP_')) {
                continue;
            }

            $name = str_replace('_', '-', substr($key, 5));
            $headers[self::normalizeHeaderName($name)] = (string) $value;
        }

        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['Content-Type'] = (string) $_SERVER['CONTENT_TYPE'];
        }

        if (isset($_SERVER['CONTENT_LENGTH'])) {
            $headers['Content-Length'] = (string) $_SERVER['CONTENT_LENGTH'];
        }

        return $headers;
    }

    protected static function parseBody(string $method, array $headers, string $rawBody): array
    {
        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return [];
        }

        $contentType = '';
        foreach ($headers as $name => $value) {
            if (strtolower($name) === 'content-type') {
                $contentType = strtolower(trim(explode(';', $value)[0]));
                break;
            }
        }

        if ($contentType === 'application/json') {
            $decoded = json_decode($rawBody, true);
            return is_array($decoded) ? $decoded : [];
        }

        if (in_array($contentType, ['application/x-www-form-urlencoded', 'multipart/form-data'], true)) {
            return $_POST;
        }

        return [];
    }

    protected static function normalizeHeaderName(string $name): string
    {
        return implode('-', array_map(static fn(string $part): string => ucfirst(strtolower($part)), explode('-', $name)));
    }
}
