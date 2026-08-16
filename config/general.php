<?php

/**
 * General Craft configuration.
 *
 * Per-environment settings (devMode, allowAdminChanges, timeZone, cpTrigger,
 * disallowRobots, etc.) are auto-read by Craft from CRAFT_* env vars in .env
 * — we don't need to declare them here. This file only holds project-wide
 * constants that should be the same across every environment.
 *
 * @see https://craftcms.com/docs/5.x/reference/config/general.html
 */

use craft\config\GeneralConfig;
use craft\helpers\App;

$cloudEnvironmentId = App::env('CRAFT_CLOUD_ENVIRONMENT_ID');
$cloudBuildId = App::env('CRAFT_CLOUD_BUILD_ID');
$cloudCdnBaseUrl = App::env('CRAFT_CLOUD_CDN_BASE_URL') ?: 'https://cdn.craft.cloud';
$artifactBaseUrl = App::env('CRAFT_CLOUD_ARTIFACT_BASE_URL');

if (!$artifactBaseUrl && $cloudEnvironmentId && $cloudBuildId) {
    $artifactBaseUrl = sprintf(
        '%s/%s/builds/%s/artifacts',
        rtrim((string)$cloudCdnBaseUrl, '/'),
        rawurlencode((string)$cloudEnvironmentId),
        rawurlencode((string)$cloudBuildId),
    );
}

$artifactUrl = static fn(string $path): string => ($artifactBaseUrl ? rtrim((string)$artifactBaseUrl, '/') : '')
    . '/'
    . ltrim($path, '/');

return GeneralConfig::create()
    // URL handling
    ->omitScriptNameInUrls()
    ->errorTemplatePrefix('errors/')
    ->aliases([
        '@web' => App::env('PRIMARY_SITE_URL'),
        '@webroot' => dirname(__DIR__) . '/web',
    ])

    // Users / auth
    ->useEmailAsUsername(true)
    ->autoLoginAfterAccountActivation(true)
    ->userSessionDuration('P1D')
    ->defaultTokenDuration('P2W')
    ->preventUserEnumeration(true)

    // Content
    ->defaultWeekStartDay(1)
    ->maxRevisions(5)
    ->preloadSingles(true)
    ->limitAutoSlugsToAscii(true)
    ->defaultSearchTermOptions([
        'subLeft' => true,
        'subRight' => true,
    ])

    // Performance / caching
    ->cacheDuration(false)
    ->generateTransformsBeforePageLoad(true)
    ->maxCachedCloudImageSize(3000)
    ->transformGifs(false)

    // Security / hardening
    ->enableCsrfProtection(true)
    ->asyncCsrfInputs(true)
    ->sendPoweredByHeader(false)
    ->maxUploadFileSize('100M')

    // CP customizations (served from the built Vite assets)
    ->cpHeadTags([
        // CP stylesheet — login branding, RTL fixes, content builder tweaks
        ['link', ['rel' => 'stylesheet', 'href' => $artifactUrl('dist/assets/cp/cp.css')]],
        // CP favicons
        ['link', ['rel' => 'icon', 'href' => $artifactUrl('dist/assets/cp/favicons/favicon.ico')]],
        ['link', ['rel' => 'icon', 'type' => 'image/svg+xml', 'sizes' => 'any', 'href' => $artifactUrl('dist/assets/cp/favicons/favicon.svg')]],
        ['link', ['rel' => 'apple-touch-icon', 'sizes' => '180x180', 'href' => $artifactUrl('dist/assets/cp/favicons/apple-touch-icon.svg')]],
        ['link', ['rel' => 'mask-icon', 'href' => $artifactUrl('dist/assets/cp/favicons/safari-pinned-tab.svg'), 'color' => '#e62521']],
    ]);
