#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(rootDir, '..', 'gen');

mkdirSync(path.join(outDir, 'rest'), { recursive: true });
mkdirSync(path.join(outDir, 'grpc'), { recursive: true });

const banner = `// Auto-generated client placeholder. Replace by running shared-spec generators.`;

writeFileSync(path.join(outDir, 'README.md'), `${banner}\n`);

console.log('Generated REST and gRPC client placeholders to gen/.');
