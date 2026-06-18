import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const config = join(root, 'serve.json');

if (existsSync(distDir) && existsSync(config)) {
  copyFileSync(config, join(distDir, 'serve.json'));
}
