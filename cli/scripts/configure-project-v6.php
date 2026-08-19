<?php

declare(strict_types=1);

/**
 * Experimental Craft 6 post-install project configuration.
 *
 * Craft 6 runs inside Laravel, so this script boots Laravel's console kernel
 * and resolves Craft services from the container. Keep this separate from the
 * Craft 5/Yii adapter until the Craft 6 APIs stabilize.
 */

use CraftCms\Cms\Console\Kernel as CraftConsoleKernel;
use CraftCms\Cms\ProjectConfig\ProjectConfig;
use CraftCms\Cms\Site\SiteGroups;
use CraftCms\Cms\Site\Sites;
use CraftCms\Cms\Support\Str;
use Illuminate\Contracts\Console\Kernel;

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

/** @var \Illuminate\Foundation\Application $app */
$app = require $root . '/bootstrap/app.php';
$app->singleton(Kernel::class, CraftConsoleKernel::class);
$app->make(Kernel::class)->bootstrap();

/** @var ProjectConfig $projectConfig */
$projectConfig = $app->make(ProjectConfig::class);
$projectConfig->set('system.edition', 'pro');
$projectConfig->set('system.name', '$SYSTEM_NAME');
$projectConfig->set('system.timeZone', '$CRAFT_TIMEZONE');
echo "Set edition to Pro and timezone to \$CRAFT_TIMEZONE\n";

$sitesJsonPath = $root . '/cli/tmp/sites.json';
if (file_exists($sitesJsonPath)) {
    /** @var list<array{handle:string, language:string}> $sitesConfig */
    $sitesConfig = json_decode((string) file_get_contents($sitesJsonPath), true, flags: JSON_THROW_ON_ERROR);
    /** @var Sites $sites */
    $sites = $app->make(Sites::class);
    /** @var SiteGroups $siteGroups */
    $siteGroups = $app->make(SiteGroups::class);
    $defaultSite = $sites->getAllSites()->first();
    $defaultGroupUid = $defaultSite ? $siteGroups->getGroupById($defaultSite->groupId)?->uid : null;

    foreach ($sitesConfig as $index => $siteData) {
        $handle = $siteData['handle'];
        $language = $siteData['language'];
        $handleUpper = strtoupper($handle);
        $existing = $sites->getSiteByHandle($handle);
        $uid = $index === 0 && $defaultSite
            ? $defaultSite->uid
            : ($existing?->uid ?? Str::uuid()->toString());

        $projectConfig->set("sites.{$uid}", [
            'handle' => $handle,
            'language' => $language,
            'name' => "\$PRIMARY_SITE_NAME_{$handleUpper}",
            'baseUrl' => "\$PRIMARY_SITE_URL_{$handleUpper}",
            'hasUrls' => true,
            'primary' => $index === 0,
            'enabled' => true,
            'siteGroup' => $defaultGroupUid,
            'sortOrder' => $index + 1,
        ]);
        echo ($existing || ($index === 0 && $defaultSite) ? 'Updated' : 'Created')
            . " site: {$handle} ({$language})\n";
    }

    echo 'Multi-site configuration complete (' . count($sitesConfig) . ")\n";
}

$projectConfig->saveModifiedConfigData();
$projectConfig->writeYamlFiles(true);

if (file_exists($sitesJsonPath)) {
    unlink($sitesJsonPath);
}

echo "Project config updated successfully.\n";
