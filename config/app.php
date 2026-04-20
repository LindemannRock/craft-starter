<?php

/**
 * Yii/Craft application config.
 *
 * General settings (timezone, devMode, etc.) are auto-read from CRAFT_* env
 * vars — see cli/templates/env.example. Email transport is stored in project
 * config (not here) so the CP, Servd's checks, and any other project-config
 * reader all see the same value.
 *
 * Redis database index allocation (when Redis is enabled):
 *   DB 0 — Craft cache (REDIS_DATABASE)
 *   DB 1 — PHP sessions (REDIS_SESSION_DB, prompted during `make create`)
 *   DB 2+ — reserved for plugins / future use
 *
 * @see https://craftcms.com/docs/5.x/reference/config/app.html
 */

use craft\helpers\App;

return [
    '*' => [
        'id' => App::env('CRAFT_APP_ID') ?: 'CraftCMS',
        'components' => [
            // Cache — Redis when enabled via env var, otherwise Craft's file cache.
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
                        'database' => (int) (App::env('REDIS_DATABASE') ?: 0),
                    ],
                ]);
            },

            // Session — Redis when REDIS_SESSION_DB is set in .env (prompted
            // during `make create`), otherwise Craft's default DB-backed session.
            'session' => function () {
                $redisHost = App::env('REDIS_HOST');
                $sessionDb = App::env('REDIS_SESSION_DB');
                if (!$redisHost || !$sessionDb || !class_exists(\yii\redis\Session::class)) {
                    return Craft::createObject(App::sessionConfig());
                }
                $config = App::sessionConfig();
                $config['class'] = \yii\redis\Session::class;
                $config['redis'] = [
                    'class' => \yii\redis\Connection::class,
                    'hostname' => $redisHost,
                    'port' => App::env('REDIS_PORT') ?: 6379,
                    'password' => App::env('REDIS_PASSWORD') ?: null,
                    'database' => (int) $sessionDb,
                ];
                return Craft::createObject($config);
            },
        ],
        'modules' => [],
        'bootstrap' => [],
    ],
];
