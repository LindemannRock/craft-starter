<?php

use CraftCms\Cms\Config\GeneralConfig;

return GeneralConfig::create()
    ->aliases([
        '@web' => env('PRIMARY_SITE_URL'),
        '@webroot' => public_path(),
    ])
    ->useEmailAsUsername()
    ->autoLoginAfterAccountActivation()
    ->defaultTokenDuration('P2W')
    ->preventUserEnumeration()
    ->defaultWeekStartDay(1)
    ->maxRevisions(5)
    ->preloadSingles()
    ->limitAutoSlugsToAscii()
    ->defaultSearchTermOptions([
        'subLeft' => true,
        'subRight' => true,
    ])
    ->cacheDuration(false)
    ->generateTransformsBeforePageLoad()
    ->maxCachedCloudImageSize(3000)
    ->transformGifs(false)
    ->asyncCsrfInputs()
    ->sendPoweredByHeader(false)
    ->maxUploadFileSize('100M')
    ->cpHeadTags([
        ['link', ['rel' => 'stylesheet', 'href' => '/build/assets/cp/cp.css']],
        ['link', ['rel' => 'icon', 'href' => '/build/assets/cp/favicons/favicon.ico']],
        ['link', ['rel' => 'icon', 'type' => 'image/svg+xml', 'sizes' => 'any', 'href' => '/build/assets/cp/favicons/favicon.svg']],
        ['link', ['rel' => 'apple-touch-icon', 'sizes' => '180x180', 'href' => '/build/assets/cp/favicons/apple-touch-icon.svg']],
        ['link', ['rel' => 'mask-icon', 'href' => '/build/assets/cp/favicons/safari-pinned-tab.svg', 'color' => '#e62521']],
    ]);
