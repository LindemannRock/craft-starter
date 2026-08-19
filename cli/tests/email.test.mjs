import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('SMTP project configuration', () => {
	it('uses the prompted authentication and encryption values', () => {
		const config = fs.readFileSync(path.join(root, 'cli/scripts/configure-project.php'), 'utf-8');
		const env = fs.readFileSync(path.join(root, 'cli/templates/env.example'), 'utf-8');
		expect(config).toContain("getenv('SMTP_USE_AUTH')");
		expect(config).toContain("getenv('SMTP_ENCRYPTION_METHOD')");
		expect(config).not.toContain("'useAuthentication' => true");
		expect(config).not.toContain("'encryptionMethod' => 'tls'");
		expect(env).toContain('SMTP_ENCRYPTION_METHOD=tls');
	});
});
