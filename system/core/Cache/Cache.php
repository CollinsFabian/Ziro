<?php

namespace Ziro\System\Cache;

use \Exception;

class Cache
{
    protected string $cachePath;

    public function __construct(?string $path = null)
    {
        $this->cachePath = rtrim($path ?? __DIR__ . "/../../storage/cache", DIRECTORY_SEPARATOR);

        if (!is_dir($this->cachePath) && !mkdir($this->cachePath, 0775, true)) {
            throw new Exception("Cache directory {$this->cachePath} is not writable");
        }
    }

    /**
     * Get an item from the cache.
     */
    public function get(string $key, mixed $default = null)
    {
        $file = $this->getFilePath($key);

        if (!is_file($file)) return $default;

        $content = file_get_contents($file);
        $expire = (int) substr($content, 0, 10);

        if (time() >= $expire) {
            $this->delete($key);
            return $default;
        }
        $data = substr($content, 10);

        return $data !== false ? unserialize($data) : $default;
    }

    /**
     * Add an item to the cache.
     */
    public function set(string $key, mixed $value, int $ttl = 3600): bool
    {
        $file = $this->getFilePath($key);
        $dir = dirname($file);

        if (!is_dir($dir)) mkdir($dir, 0775, true);

        $expire = time() + $ttl;
        $data = $expire . serialize($value);

        return (bool) file_put_contents($file, $data, LOCK_EX);
    }

    /**
     * Delete an item in the cache.
     */
    public function delete(string $key): bool
    {
        $file = $this->getFilePath($key);
        return is_file($file) ? unlink($file) : false;
    }

    /**
     * Check if an item exists and hasn't expired.
     */
    public function has(string $key): bool
    {
        return $this->get($key) != null;
    }

    /**
     * Wipe an entire cache directory.
     */
    public function clear(): bool
    {
        if (!is_dir($this->cachePath)) return true;
        if (!is_writable($this->cachePath)) throw new Exception("Permission denied: Ziro cannot clear {$this->cachePath}.");;

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($this->cachePath, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($files as $file) {
            if (!$file instanceof \SplFileInfo) continue;

            $todo = $file->isDir() ? "mkdir" : "unlink";
            $path = $file->getRealPath();

            if ($file->getRealPath() !== realpath($this->cachePath)) {
                @$todo($file->getRealPath());
            }
        }

        return true;
    }

    /**
     * Generate a high-performance nested path.
     *
     * Structure: storage/cache/a1/b2/c3/a1b2c3....cache
     */
    public function getFilePath(string $key): string
    {
        $hash = sha1($key);

        // 3 pairs of chars for 3-level nesting
        $parts = [
            $this->cachePath,
            substr($hash, 0, 2),
            substr($hash, 2, 2),
            substr($hash, 4, 2),
        ];

        return implode(DIRECTORY_SEPARATOR, $parts) . DIRECTORY_SEPARATOR . $hash . ".cache";
    }
}
