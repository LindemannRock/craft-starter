<?php
/**
 * Post-install project config configuration.
 *
 * Runs after `craft install` + `craft up` to safely update project config via
 * Craft's own API. We use Craft::$app->projectConfig->set() instead of
 * manipulating YAML directly because:
 *
 *   1. Craft 5 splits project config across multiple YAML files
 *   2. Craft handles the split transparently when going through its API
 *   3. set() fires events that sync plugin/service state and persist both
 *      YAML + database in one step
 *
 * Email transport resolution:
 *   1. POSTMARK_TOKEN is set → Postmark (if plugin is installed)
 *   2. SMTP_HOSTNAME is set → generic SMTP (Servd SMTP, Mailgun, custom)
 *   3. Otherwise → Mailpit (safe dev-mode default — never hits real inboxes)
 *
 * Called from cli/actions/projectConfig.mjs via `ddev exec php`.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

define('CRAFT_BASE_PATH', dirname(__DIR__, 2));
define('CRAFT_VENDOR_PATH', CRAFT_BASE_PATH . '/vendor');

require CRAFT_VENDOR_PATH . '/autoload.php';

// Load .env so getenv() reflects what the CLI configured
if (class_exists('Dotenv\Dotenv') && file_exists(CRAFT_BASE_PATH . '/.env')) {
    Dotenv\Dotenv::createUnsafeMutable(CRAFT_BASE_PATH)->safeLoad();
}

define('CRAFT_ENVIRONMENT', getenv('CRAFT_ENVIRONMENT') ?: 'dev');

/** @var \craft\console\Application $app */
$app = require CRAFT_VENDOR_PATH . '/craftcms/cms/bootstrap/console.php';

$projectConfig = Craft::$app->projectConfig;
$currentEmail = $projectConfig->get('email') ?? [];

$email = array_merge($currentEmail, [
    'fromEmail' => '$SYSTEM_EMAIL',
    'fromName' => '$SYSTEM_SENDER_NAME',
    'replyToEmail' => '$SYSTEM_EMAIL_REPLY_TO',
    'template' => $currentEmail['template'] ?? '',
]);

$postmarkToken = getenv('POSTMARK_TOKEN');
$smtpHost = getenv('SMTP_HOSTNAME');
$mailpitHost = getenv('MAILPIT_SMTP_HOSTNAME');

if ($postmarkToken && class_exists('craftcms\\postmark\\Adapter')) {
    // 1. Postmark (real transactional email — used in dev if user wants to test)
    $email['transportType'] = 'craftcms\\postmark\\Adapter';
    $email['transportSettings'] = [
        'token' => '$POSTMARK_TOKEN',
    ];
    echo "Configured Postmark email transport\n";
} elseif ($smtpHost) {
    // 2. Generic SMTP (Servd SMTP, Mailgun, custom)
    $email['transportType'] = 'craft\\mail\\transportadapters\\Smtp';
    $email['transportSettings'] = [
        'host' => '$SMTP_HOSTNAME',
        'port' => '$SMTP_PORT',
        'useAuthentication' => true,
        'username' => '$SMTP_USERNAME',
        'password' => '$SMTP_PASSWORD',
        'encryptionMethod' => 'tls',
    ];
    echo "Configured SMTP email transport (host: {$smtpHost})\n";
} elseif ($mailpitHost) {
    // 3. Mailpit — safe dev default (never sends real emails)
    $email['transportType'] = 'craft\\mail\\transportadapters\\Smtp';
    $email['transportSettings'] = [
        'host' => '$MAILPIT_SMTP_HOSTNAME',
        'port' => '$MAILPIT_SMTP_PORT',
        'useAuthentication' => false,
    ];
    echo "Configured Mailpit email transport (dev default)\n";
} else {
    // Nothing to configure — leave Craft's default Sendmail
    echo "No email transport settings detected — leaving Craft default (Sendmail)\n";
    exit(0);
}

$projectConfig->set('email', $email);

// System settings — Pro edition, timezone from env var.
// system.live is controlled by CRAFT_IS_SYSTEM_LIVE in .env (auto-read by Craft).
$projectConfig->set('system.edition', 'pro');
$projectConfig->set('system.name', '$SYSTEM_NAME');
$projectConfig->set('system.timeZone', '$CRAFT_TIMEZONE');
echo "Set edition to Pro, timezone to \$CRAFT_TIMEZONE\n";

// Multi-site configuration — read from temp JSON written by the CLI
$sitesJsonPath = CRAFT_BASE_PATH . '/cli/tmp/sites.json';
if (file_exists($sitesJsonPath)) {
    $sitesConfig = json_decode(file_get_contents($sitesJsonPath), true);
    $sitesService = Craft::$app->sites;
    $existingSites = $sitesService->getAllSites();
    $primarySiteUrl = getenv('PRIMARY_SITE_URL');

    // The default site created by `craft install` — we'll update it to match the first CLI site
    $defaultSite = $existingSites[0] ?? null;

    // Get the default site group UID from the default site
    $defaultGroupUid = null;
    if ($defaultSite) {
        $group = Craft::$app->sites->getGroupById($defaultSite->groupId);
        $defaultGroupUid = $group ? $group->uid : null;
    }

    foreach ($sitesConfig as $i => $siteData) {
        $handle = $siteData['handle'];
        $language = $siteData['language'];
        $handleUpper = strtoupper($handle);
        $baseUrl = "\$PRIMARY_SITE_URL_{$handleUpper}";
        $siteName = "\$PRIMARY_SITE_NAME_{$handleUpper}";

        if ($i === 0 && $defaultSite) {
            // Update the default site (created by craft install) via project config
            $uid = $defaultSite->uid;
            $projectConfig->set("sites.{$uid}", [
                'handle' => $handle,
                'language' => $language,
                'name' => $siteName,
                'baseUrl' => $baseUrl,
                'hasUrls' => true,
                'primary' => true,
                'enabled' => true,
                'siteGroup' => $defaultGroupUid,
                'sortOrder' => $i + 1,
            ]);
            echo "Updated default site: {$handle} ({$language})\n";
        } else {
            // Check if site with this handle already exists
            $existing = $sitesService->getSiteByHandle($handle);
            $uid = $existing ? $existing->uid : \craft\helpers\StringHelper::UUID();

            $projectConfig->set("sites.{$uid}", [
                'handle' => $handle,
                'language' => $language,
                'name' => $siteName,
                'baseUrl' => $baseUrl,
                'hasUrls' => true,
                'primary' => false,
                'enabled' => true,
                'siteGroup' => $defaultGroupUid,
                'sortOrder' => $i + 1,
            ]);
            echo ($existing ? "Updated" : "Created") . " site: {$handle} ({$language})\n";
        }
    }

    // Clean up temp file
    unlink($sitesJsonPath);
    $siteCount = count($sitesConfig);
    echo "Multi-site configuration complete ({$siteCount} site" . ($siteCount === 1 ? '' : 's') . ")\n";
}

// In a standalone script (not a full Craft request), the `afterRequest` hook
// that normally persists project config never fires. Call the two public save
// methods explicitly so both the DB and YAML files get updated.
$projectConfig->saveModifiedConfigData();
$projectConfig->writeYamlFiles(true);

echo "Project config updated successfully.\n";
