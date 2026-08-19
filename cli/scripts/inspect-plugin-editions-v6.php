<?php

declare(strict_types=1);

use CraftCms\Cms\Console\Kernel as CraftConsoleKernel;
use CraftCms\Cms\Plugin\Plugins;
use Illuminate\Contracts\Console\Kernel;

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

/** @var \Illuminate\Foundation\Application $app */
$app = require $root . '/bootstrap/app.php';
$app->singleton(Kernel::class, CraftConsoleKernel::class);
$app->make(Kernel::class)->bootstrap();

/** @var Plugins $plugins */
$plugins = $app->make(Plugins::class);
$result = [];

foreach (array_slice($argv, 1) as $handle) {
    $info = $plugins->getPluginInfo($handle);
    /** @var class-string<\CraftCms\Cms\Plugin\Contracts\PluginInterface> $class */
    $class = $info['class'];
    $result[$handle] = array_values($class::editions());
}

echo 'CRAFT_STARTER_EDITIONS=' . json_encode($result, JSON_THROW_ON_ERROR) . PHP_EOL;
