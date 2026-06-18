import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dest = join(root, 'public', 'staircase');
const postModule = resolve(root, '../../../staircase/web/staircase-module-post.js');
const buildDir = resolve(root, '../../../staircase/build/staircase');

mkdirSync(dest, { recursive: true });

if (existsSync(postModule)) {
  cpSync(postModule, join(dest, 'staircase-module-post.js'));
  console.log('Copied staircase-module-post.js');
}

if (existsSync(join(buildDir, 'staircase.js'))) {
  for (const file of ['staircase.js', 'staircase.wasm', 'staircase.worker.js']) {
    const src = join(buildDir, file);
    if (existsSync(src)) {
      cpSync(src, join(dest, file));
      console.log(`Copied ${file}`);
    }
  }
} else {
  console.warn('Staircase WASM build not found — STEP files will use OCCT fallback until you run `make` in staircase/');
}
