#!/usr/bin/env node

/**
 * Silent Makefile adapter for the shared DDEV readiness check.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import { isDdevProjectReady } from '../utils/ddev.mjs';

process.exit(isDdevProjectReady() ? 0 : 1);
