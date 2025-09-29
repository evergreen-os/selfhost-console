#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(rootDir, '..');

const bufBinary = path.resolve(projectRoot, 'node_modules', '.bin', 'buf');

const command = spawnSync(bufBinary, ['generate'], {
  cwd: projectRoot,
  stdio: 'inherit'
});

if (command.error) {
  console.error('Failed to run buf generate. Ensure @bufbuild/buf is installed.');
  console.error(command.error);
  process.exit(1);
}

if (command.status !== 0) {
  process.exit(command.status ?? 1);
}

console.log('Generated TypeScript clients into gen/.');
