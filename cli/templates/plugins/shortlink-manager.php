<?php
/**
 * ShortLink Manager config.php
 *
 * This file exists only as a template for the ShortLink Manager settings.
 * It does nothing on its own.
 *
 * Don't edit this file, instead copy it to 'craft/config' as 'shortlink-manager.php'
 * and make your changes there to override default settings.
 *
 * Once copied to 'craft/config', this file will be multi-environment aware as
 * well, so you can have different settings groucps for each environment, just as
 * you do for 'general.php'
 *
 * @since 5.0.0
 */

use craft\helpers\App;

return [
    // Global settings
    '*' => [
        // ========================================
        // GENERAL SETTINGS
        // ========================================
        // Basic plugin configuration and URL settings

        'pluginName' => 'ShortLink Manager',

        // IP Privacy Protection
        // Generate salt with: php craft shortlink-manager/security/generate-salt
        // Store in .env as: SHORTLINK_MANAGER_IP_SALT="your-64-char-salt"
        'ipHashSalt' => App::env('SHORTLINK_MANAGER_IP_SALT'),

        // Site Settings
        'enabledSites' => [],          // Array of site IDs where ShortLink Manager should be enabled (empty = all sites)

        // URL Settings
        'usePrefix' => true,           // Whether shortlinks should include slugPrefix in URLs (true => /s/abc123, false => /abc123)
        'slugPrefix' => 's',           // URL prefix for shortlinks (e.g., 's' creates /s/ABC123)
        'shortlinkBaseUrl' => null,    // Base URL for generated shortlinks; supports tokens {siteHandle}, {siteId}, {siteUid}
        'qrPrefix' => 's/qr',          // URL prefix for QR code pages (e.g., 's/qr' or 'qr')
        'codeLength' => 8,             // Length of generated shortlink codes
        'reservedCodes' => ['admin', 'api', 'login', 'logout', 'cp', 'dashboard', 'settings'],

        // Template Settings
        // These templates MUST exist in your site's templates/ folder.
        // Copy from: vendor/lindemannrock/craft-shortlink-manager/src/templates/{name}.twig
        //       to:  templates/shortlink-manager/{name}.twig
        // Then customize as needed. Leaving null uses the default path 'shortlink-manager/{name}'.
        'redirectTemplate' => null,    // Default path: shortlink-manager/redirect
        'expiredTemplate' => null,     // Default path: shortlink-manager/expired
        'qrTemplate' => null,          // Default path: shortlink-manager/qr
        'expiredMessage' => 'This link has expired',

        // Logging Settings
        'logLevel' => 'error',         // Log level: 'debug', 'info', 'warning', 'error'


        // ========================================
        // QR CODE SETTINGS
        // ========================================
        // Appearance, styling, logo, and download options for QR codes

        // Note: Individual shortlinks inherit these defaults. Only custom-set values are saved.
        // If a shortlink's color matches the global default, it's stored as NULL and will
        // automatically update when you change the global default.
        'defaultQrSize' => 256,        // Size in pixels (100-1000)
        'defaultQrFormat' => 'png',    // Format: 'png' or 'svg'
        'defaultQrColor' => '#000000', // Foreground color (default: black)
        'defaultQrBgColor' => '#FFFFFF', // Background color (default: white)
        'defaultQrMargin' => 4,        // White space around QR code (0-10 modules)
        'qrModuleStyle' => 'square',   // Module shape: 'square', 'rounded', 'dots'
        'qrEyeStyle' => 'square',      // Eye shape: 'square', 'rounded', 'pointed'
        'qrEyeColor' => null,          // Eye color (null = use main color)

        // Logo Settings
        'enableQrLogo' => false,       // Enable logo overlay in center of QR codes
        // 'qrLogoVolumeUid' => null,  // Asset volume UID for logo selection (usually set in UI)
        // 'defaultQrLogoId' => null,  // Default logo asset ID (usually set in UI)
        'qrLogoSize' => 20,            // Logo size as percentage (10-30%)

        // Technical Options
        'defaultQrErrorCorrection' => 'M', // Error correction level: L, M, Q, H

        // Download Settings
        'enableQrDownload' => true,    // Allow users to download QR codes
        'qrDownloadFilename' => '{code}-qr-{size}', // Pattern with {code}, {size}, {format}


        // ========================================
        // ANALYTICS SETTINGS
        // ========================================
        // Click tracking, device detection, and data retention

        'enableAnalytics' => true,
        'enableGeoDetection' => false, // Detect visitor location for analytics
        'anonymizeIpAddress' => false, // Subnet masking (192.168.1.123 → 192.168.1.0) before hashing
        'analyticsRetention' => 90,    // Days to keep analytics data (0 = unlimited)

        // Geo IP lookup provider
        // Options: 'ip-api.com', 'ipapi.co', 'ipinfo.io'
        // - ip-api.com: HTTP free (45/min), HTTPS requires paid key (default, backward compatible)
        // - ipapi.co: HTTPS, 1,000 requests/day free
        // - ipinfo.io: HTTPS, 50,000 requests/month free
        // 'geoProvider' => 'ip-api.com',

        // Geo provider API key
        // Required for ip-api.com HTTPS (Pro tier)
        // Optional for ipapi.co and ipinfo.io (increases rate limits)
        // 'geoApiKey' => App::env('SHORTLINK_MANAGER_GEO_API_KEY'),

        // Default location for local development
        // Used when IP address is private/local (127.0.0.1, 192.168.x.x, etc.)
        // Both values must be configured explicitly; otherwise private/local IP geo fields stay empty.
        // 'defaultCountry' => App::env('SHORTLINK_MANAGER_DEFAULT_COUNTRY'), // 2-letter country code (US, GB, AE, etc.)
        // 'defaultCity' => App::env('SHORTLINK_MANAGER_DEFAULT_CITY'), // Must match a city in the predefined locations list


        // ========================================
        // REDIRECT BEHAVIOR SETTINGS
        // ========================================
        // How redirects behave and where they go

        'defaultHttpCode' => 302,      // Default HTTP redirect code (301, 302, 307, 308)
        'passQueryParams' => false,    // Pass query params from shortlink URL to destination
        'directRedirect' => false,     // Direct server-side HTTP redirect without template render (disables SEOmatic client-side tracking)
        'notFoundRedirectUrl' => '/',  // Where to redirect for invalid/disabled shortlinks


        // ========================================
        // INTEGRATION SETTINGS
        // ========================================
        // Third-party integrations for enhanced functionality

        'enabledIntegrations' => [],   // Enabled integration handles (e.g., ['seomatic', 'redirect-manager'])

        // SEOmatic Integration
        'seomaticTrackingEvents' => ['redirect', 'qr_scan'], // Event types to track
        'seomaticEventPrefix' => 'shortlink_manager', // Event prefix for GTM/GA events (lowercase, numbers, underscores only)

        // Redirect Manager Integration
        'redirectManagerEvents' => ['slug-change'], // Which events create redirects


        // ========================================
        // INTERFACE SETTINGS
        // ========================================
        // Control panel interface options

        'itemsPerPage' => 100,         // Number of shortlinks per page (10-500)


        // ========================================
        // CACHE SETTINGS
        // ========================================
        // Performance and caching configuration

        // Cache Storage Method
        // 'file' = Plugin-owned files on durable hosts (default). On ephemeral hosts,
        //          ShortLink Manager attempts to use a suitable Craft application cache.
        // 'craft' = Explicitly use Craft's suitable cross-request application cache.
        // 'redis' = Backward-compatible token for the same application-cache selection;
        //           it does not itself configure or guarantee Redis.
        // If the selected application cache is unsuitable for cross-request persistence,
        // persistent plugin caching is disabled rather than silently changing backends.
        'cacheStorageMethod' => 'file',

        // QR Code Caching
        'enableQrCodeCache' => true,   // Cache generated QR codes
        'qrCodeCacheDuration' => 86400, // QR cache duration in seconds (24 hours)

        // Device Detection Caching
        'cacheDeviceDetection' => true, // Cache device detection results
        'deviceDetectionCacheDuration' => 3600, // Device detection cache in seconds (1 hour)


        // ========================================
        // BASE SETTINGS OVERRIDES
        // ========================================
        // Optional per-plugin overrides for settings that normally cascade from
        // the plugin Settings UI. When the UI value is "Use global default",
        // the value cascades from config/lindemannrock-base.php.
        //
        // To customize globally, copy:
        // vendor/lindemannrock/craft-plugin-base/src/config.php
        // to:
        // config/lindemannrock-base.php
        //
        // Uncomment a key here only when this plugin should override the global base value.

        /**
         * Date/time formatting overrides
         * Override base plugin date/time display settings for this plugin
         * Defaults: from config/lindemannrock-base.php
         */
        // 'timeFormat' => '24',      // '12' (AM/PM) or '24' (military)
        // 'monthFormat' => 'short',  // 'numeric' (01), 'short' (Jan), 'long' (January)
        // 'dateOrder' => 'dmy',      // 'dmy', 'mdy', 'ymd'
        // 'dateSeparator' => '/',    // '/', '-', '.'
        // 'showSeconds' => false,    // Show seconds in time display

        /**
         * Default date range for analytics, logs, and dashboard pages
         * Options: 'today', 'yesterday', 'thisWeek', 'lastWeek', 'last7days',
         *          'last14days', 'last30days', 'last90days', 'thisMonth',
         *          'lastMonth', 'thisQuarter', 'lastQuarter', 'thisYear',
         *          'lastYear', 'last12months', 'all'
         * Default: 'last30days' (from base plugin)
         */
        // 'defaultDateRange' => 'last7days',

        /**
         * Export format overrides
         * Enable/disable specific export formats for this plugin
         * Default: CSV and Excel enabled, JSON disabled (developer format — from base plugin)
         */
        // 'exports' => [
        //     'csv' => true,
        //     'json' => true,
        //     'excel' => true,
        // ],
    ],

    // Dev environment settings
    'dev' => [
        'logLevel' => 'debug',         // More verbose logging in dev
        'analyticsRetention' => 30,    // Keep less data in dev
        'cacheDeviceDetection' => false, // No cache - testing
        'enableQrCodeCache' => false,  // No cache - see changes immediately
        'qrCodeCacheDuration' => 60,   // 1 minute - minimal cache if enabled
    ],

    // Staging environment settings
    'staging' => [
        'logLevel' => 'info',          // Moderate logging in staging
        'analyticsRetention' => 90,
        'cacheDeviceDetection' => true,
        'deviceDetectionCacheDuration' => 1800, // 30 minutes
        'qrCodeCacheDuration' => 3600, // 1 hour
    ],

    // Production environment settings
    'production' => [
        'logLevel' => 'error',         // Only errors in production
        'analyticsRetention' => 365,   // Keep more data in production
        'cacheStorageMethod' => 'craft', // Use Craft's configured suitable application cache
        'cacheDeviceDetection' => true,
        'deviceDetectionCacheDuration' => 7200, // 2 hours
        'qrCodeCacheDuration' => 604800, // 7 days - QR codes rarely change
    ],
];
