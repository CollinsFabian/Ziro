<?php

return [
    'required_directories' => [
        'app',
        'bootstrap',
        'bootstrap/routes',
        'database',
        'public',
        'public/assets',
        'resources',
        'resources/assets',
        'system',
        'system/core',
        'system/deploy',
        'system/tools',
        'system/tools/builder',
    ],
    'required_files' => [
        'bootstrap/app.php',
        'bootstrap/routes/api.php',
        'bootstrap/routes/web.php',
        'public/index.php',
        'resources/index.html',
        'README.md',
        'composer.json',
        'package.json',
        'system/core/CLI/zi.php',
        'system/core/Contracts/structure.rules.php',
    ],
    'forbidden_path_patterns' => [],
    'sealed_directory_patterns' => [
        'bootstrap' => [
            'files' => [
                '#^app\.php$#',
            ],
            'directories' => [
                '#^routes$#',
            ],
        ],
        'bootstrap/routes' => [
            'files' => [
                '#^api\.php$#',
                '#^web\.php$#',
            ],
            'directories' => [],
        ],
        'resources' => [
            'files' => [
                '#^index\.html$#',
            ],
            'directories' => [
                '#^assets$#',
            ],
        ],
        'public' => [
            'files' => [
                '#^index\.php$#',
                '#^index\.html$#',
                '#^manifest\.json$#',
            ],
            'directories' => [
                '#^assets$#',
            ],
        ],
        'system' => [
            'files' => [],
            'directories' => [
                '#^core$#',
                '#^deploy$#',
                '#^tools$#',
                '#^storage$#',
            ],
        ],
    ],
    'allowed_root_entry_patterns' => [
        '#^\.env$#',
        '#^\.env\.example$#',
        '#^\.git$#',
        '#^\.gitignore$#',
        '#^\.tmp$#',
        '#^README\.md$#',
        '#^app$#',
        '#^bootstrap$#',
        '#^composer\.json$#',
        '#^composer\.lock$#',
        '#^database$#',
        '#^node_modules$#',
        '#^package-lock\.json$#',
        '#^package\.json$#',
        '#^public$#',
        '#^resources$#',
        '#^system$#',
        '#^tsconfig\.json$#',
        '#^vendor$#',
        '#^zi$#',
        '#^zi\.bat$#',
    ],
    'ignored_root_entries' => [
        '.vscode',
        '.idea',
        '.zed',
        '.fleet',
    ],
    'ignored_root_patterns' => [
        '/^\.history$/',
    ],
];
