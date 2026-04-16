<?php

/**
 * Yii/Craft application config.
 *
 * General settings (timezone, devMode, etc.) are auto-read from CRAFT_* env
 * vars — see cli/templates/env.example. Email transport is stored in project
 * config (not here) so the CP, Servd's checks, and any other project-config
 * reader all see the same value.
 *
 * @see https://craftcms.com/docs/5.x/reference/config/app.html
 */

use craft\helpers\App;

return [
    '*' => [
        'id' => App::env('CRAFT_APP_ID') ?: 'CraftCMS',
        'components' => [
            // Cache — uses Redis when enabled via env var AND the yii2-redis
            // package is installed; otherwise falls back to Craft's default
            // file-based cache. The env-var check is the source of truth so
            // stale vendor/ (e.g. leftover yii2-redis from a previous install)
            // doesn't accidentally activate Redis after the user opted out.
            'cache' => function () {
                $redisHost = App::env('REDIS_HOST');
                if (!$redisHost || !class_exists(\yii\redis\Cache::class)) {
                    return Craft::createObject(App::cacheConfig());
                }

                return Craft::createObject([
                    'class' => \yii\redis\Cache::class,
                    'keyPrefix' => Craft::$app->id,
                    'defaultDuration' => 3600,
                    'redis' => [
                        'class' => \yii\redis\Connection::class,
                        'hostname' => $redisHost,
                        'port' => App::env('REDIS_PORT') ?: 6379,
                        'password' => App::env('REDIS_PASSWORD') ?: null,
                    ],
                ]);
            },
        ],
        'modules' => [],
        'bootstrap' => [],
    ],
];
