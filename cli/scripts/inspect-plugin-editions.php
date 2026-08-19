<?php

define('CRAFT_BASE_PATH', dirname(__DIR__, 2));
define('CRAFT_VENDOR_PATH', CRAFT_BASE_PATH . '/vendor');

require CRAFT_VENDOR_PATH . '/autoload.php';

if (class_exists('Dotenv\\Dotenv') && file_exists(CRAFT_BASE_PATH . '/.env')) {
    Dotenv\Dotenv::createUnsafeMutable(CRAFT_BASE_PATH)->safeLoad();
}

define('CRAFT_ENVIRONMENT', getenv('CRAFT_ENVIRONMENT') ?: 'dev');

/** @var \craft\console\Application $app */
$app = require CRAFT_VENDOR_PATH . '/craftcms/cms/bootstrap/console.php';
$plugins = Craft::$app->getPlugins();
$result = [];

foreach (array_slice($argv, 1) as $handle) {
    $info = $plugins->getPluginInfo($handle);
    /** @var class-string<\craft\base\PluginInterface> $class */
    $class = $info['class'];
    $result[$handle] = array_values($class::editions());
}

echo 'CRAFT_STARTER_EDITIONS=' . json_encode($result, JSON_THROW_ON_ERROR) . PHP_EOL;
