#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';
import { markSetupComplete, readSetupManifest } from '../actions/setupManifest.mjs';

const manifest = readSetupManifest();
if (manifest?.status === 'pending') markSetupComplete();
fs.rmSync(path.join(ROOT, 'cli', 'tmp'), { recursive: true, force: true });
