/**
 * @copyright 2026 LindemannRock
 * @license MIT
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const CLI_DIR = path.dirname(__filename);

export const ROOT = path.resolve(CLI_DIR, '..');
export { CLI_DIR };
