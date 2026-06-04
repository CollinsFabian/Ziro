<?php

declare(strict_types=1);

namespace Ziro\System\Http;

class Response
{
    public function __construct(protected string $content = '', protected int $status = 200, protected array $headers = []) {}

    public function send(): void
    {
        http_response_code($this->status);
        foreach ($this->headers as $key => $value) {
            header($key . ': ' . $value);
        }
        echo $this->content;
    }

    public static function json(array $data, int $status = 200, array $headers = []): self
    {
        return new self(
            (string) json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            $status,
            array_merge(['Content-Type' => 'application/json'], $headers)
        );
    }

    public static function html(string $content, int $status = 200, array $headers = []): self
    {
        return new self(
            $content,
            $status,
            array_merge(['Content-Type' => 'text/html; charset=UTF-8'], $headers)
        );
    }

    public static function redirect(string $url, $status = 302): static
    {
        return new static('', (int) $status, ['Location' => $url]);
    }

    public function withHeader(string $key, string $value): self
    {
        $clone = clone $this;
        $clone->headers[$key] = $value;
        return $clone;
    }

    public function withHeaders(array $headers): self
    {
        $clone = clone $this;
        $clone->headers = array_merge($clone->headers, $headers);
        return $clone;
    }
}
