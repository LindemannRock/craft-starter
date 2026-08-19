<?php

declare(strict_types=1);

use CraftCms\Cms\Console\Kernel as CraftConsoleKernel;
use CraftCms\Cms\ProjectConfig\ProjectConfig;
use Illuminate\Contracts\Console\Kernel;

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

/** @var \Illuminate\Foundation\Application $app */
$app = require $root . '/bootstrap/app.php';
$app->singleton(Kernel::class, CraftConsoleKernel::class);
$app->make(Kernel::class)->bootstrap();

$path = $argv[1] ?? null;
if (!$path) {
    fwrite(STDERR, "A project-config path is required.\n");
    exit(1);
}

/** @var ProjectConfig $projectConfig */
$projectConfig = $app->make(ProjectConfig::class);
$value = $projectConfig->get($path);

if (is_scalar($value)) {
    echo $value . PHP_EOL;
} elseif ($value !== null) {
    echo json_encode($value, JSON_THROW_ON_ERROR) . PHP_EOL;
}
