/**
 * Durable, non-secret record of the choices made by `make create`.
 *
 * The manifest is committed with generated projects so failed installs can be
 * resumed and later setup runs can reconcile files they previously managed.
 * Credentials are deliberately excluded; `.env` remains their only home.
 */

import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';

export const SETUP_MANIFEST_FILENAME = '.craft-starter.json';
export const SETUP_MANIFEST_VERSION = 1;

export function setupManifestPath(root = ROOT) {
	return path.join(root, SETUP_MANIFEST_FILENAME);
}

export function readSetupManifest({ root = ROOT } = {}) {
	const manifestPath = setupManifestPath(root);
	if (!fs.existsSync(manifestPath)) return null;

	try {
		const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
		return manifest.schemaVersion === SETUP_MANIFEST_VERSION ? manifest : null;
	} catch {
		return null;
	}
}

export function buildSetupManifest(state, { status = 'pending' } = {}) {
	const { project = {}, database = {}, selectedHosting = {}, smtpCredentials } = state;
	const plugins = [
		...(state.selectedLr || []).map((plugin) => manifestPlugin(plugin, 'lindemannrock')),
		...(state.selectedTp || []).map((plugin) => manifestPlugin(plugin, 'third-party')),
	].sort((a, b) => a.handle.localeCompare(b.handle));

	return {
		schemaVersion: SETUP_MANIFEST_VERSION,
		status,
		project: {
			name: project.name,
			description: project.description || '',
			timezone: project.timezone,
			language: project.language,
			phpVersion: project.phpVersion,
			database: database.value,
			weekStartDay: project.weekStartDay,
			cpTrigger: project.cpTrigger,
			adminEmail: project.adminEmail,
			systemEmail: project.systemEmail,
			noReplyEmail: project.noReplyEmail || '',
		},
		sites: (state.sites || []).map(({ handle, language, urlPrefix, name, label }) => ({
			handle,
			language,
			urlPrefix,
			name,
			label,
		})),
		redis: {
			cache: Boolean(state.useRedisCache),
			sessions: Boolean(state.useRedisCache && state.useRedisSession),
		},
		criticalCss: Boolean(state.useCritical),
		commitBuildFiles: Boolean(state.commitBuildFiles),
		plugins,
		hosting: selectedHosting.value || 'none',
		translationCategory: state.translationCategory || 'site',
		email: smtpCredentials
			? {
					type: 'smtp',
					useAuthentication: Boolean(smtpCredentials.useAuth),
					encryptionMethod: smtpCredentials.encryption || null,
				}
			: { type: state.postmarkToken ? 'postmark' : 'default' },
	};
}

export function writeSetupManifest(stateOrManifest, { root = ROOT, status } = {}) {
	const manifest = stateOrManifest?.schemaVersion
		? { ...stateOrManifest, ...(status ? { status } : {}) }
		: buildSetupManifest(stateOrManifest, { status: status || 'pending' });
	const manifestPath = setupManifestPath(root);
	const temporaryPath = `${manifestPath}.tmp`;

	fs.writeFileSync(temporaryPath, `${JSON.stringify(manifest, null, '\t')}\n`);
	fs.renameSync(temporaryPath, manifestPath);
	return manifest;
}

export function markSetupComplete({ root = ROOT } = {}) {
	const manifest = readSetupManifest({ root });
	if (!manifest) throw new Error(`Cannot complete setup: ${SETUP_MANIFEST_FILENAME} is missing or invalid.`);
	return writeSetupManifest(manifest, { root, status: 'complete' });
}

function manifestPlugin(plugin, source) {
	return {
		package: plugin.value,
		handle: plugin.handle,
		version: plugin.version,
		...(plugin.edition ? { edition: plugin.edition } : {}),
		source,
	};
}
