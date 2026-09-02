<?php
/**
 * Logging Library config.php
 *
 * This file exists only as a template for Logging Library settings.
 * It does nothing on its own.
 *
 * Don't edit this file, instead copy it to 'craft/config' as 'logging-library.php'
 * and make your changes there to override default settings.
 *
 * @since 5.8.0
 */

return [
    '*' => [
        // Plugin display name shown in the control panel
        'pluginName' => 'Logging Library',

        // Number of log entries shown per page in the full log viewer (10–500)
        'itemsPerPage' => 100,

        // Show this plugin in the main control panel navigation
        'showCpSection' => true,

        // Force-enable file-based log viewers even when an edge/ephemeral environment is detected
        'forceEnableLogViewer' => false,

        // Store bounded recent runtime log records for edge/ephemeral environments
        'runtimeLogStore' => [
            'enabled' => false,
            'skipConsoleRequests' => true,
            'skipQueueRequests' => true,
            'ttl' => 86400,
            'maxEntries' => 1000,
            'refreshInterval' => 5,
            'maxMessageBytes' => 8000,
            'maxContextBytes' => 8000,
            'levels' => ['error', 'warning', 'info'],
            'categories' => [],
            'except' => [],
            'redis' => [
                // Omit to inherit Craft cache's Redis database.
                // Use null to disable SELECT for compatible cluster-style endpoints.
                // 'database' => '$LOGGING_LIBRARY_RUNTIME_REDIS_DB',
            ],
            'privacy' => [
                'includeUserId' => false,
            ],
        ],

        // ========================================
        // BASE PLUGIN OVERRIDES (optional)
        // ========================================
        // These settings override lindemannrock-base defaults for this plugin only.
        // Resolution chain (high → low priority):
        //   1. Plugin config file (this file)              — env overrides
        //   2. Plugin CP setting                           — user-set in the control panel
        //   3. Base config file (config/lindemannrock-base.php) — global default
        //   4. Hardcoded defaults                          — final fallback
        // Leave commented out to fall through to layers 2-4.

        // Time formatting overrides for Logging Library.
        // Full dates shown for undated files, such as phperrors.log, use Base date settings.
        // 'timeFormat'  => '24',      // '12' (AM/PM) or '24' (military)
        // 'showSeconds' => false,
    ],
];
