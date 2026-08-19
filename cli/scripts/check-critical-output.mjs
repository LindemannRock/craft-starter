#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';
import { readSetupManifest } from '../actions/setupManifest.mjs';
import { craftProjectPath } from '../config/craft-profiles.mjs';

const craft = readSetupManifest()?.craft;
const buildPath = craftProjectPath(ROOT, 'build', craft);
process.exit(fs.existsSync(path.join(buildPath, 'criticalcss')) ? 0 : 1);
