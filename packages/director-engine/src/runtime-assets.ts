import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packaged = resolve(here, '../../../assets/runtime');
const source = resolve(here, '../../director-assets');

export const runtimeAssetRoot = existsSync(packaged) ? packaged : source;
