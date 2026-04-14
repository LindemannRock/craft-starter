/**
 * Project config modifications that need to go through Craft's own API.
 *
 * We can't just rewrite YAML files directly because Craft 5 splits project
 * config across multiple files (project.yaml + subfolders like fields/,
 * entryTypes/, formie/, etc.). A full load/dump round-trip drops the
 * split-file references and `craft up` thinks plugins are gone, uninstalling
 * them on the next run.
 *
 * Instead we shell out to a small PHP script that boots Craft and uses
 * `Craft::$app->projectConfig->set()` which handles the split-file layout
 * correctly and persists both YAML + database in one step.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import { run } from '../utils/run.mjs';

/**
 * Write email transport settings to project config via Craft's API.
 *
 * Must run AFTER plugin activation (so `craftcms\postmark\Adapter` exists
 * when Postmark is selected) and AFTER `craft up` (so Craft has a fully
 * synced state to write into).
 *
 * The PHP script reads POSTMARK_TOKEN / SMTP_HOSTNAME from .env itself — no
 * arguments needed.
 *
 */
export async function configureEmailTransport() {
	await run('ddev exec php cli/scripts/configure-project.php');
}
