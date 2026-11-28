import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Every tool slug in the registry, read from source so new tools are covered automatically. */
export const toolSlugs: string[] = [
  ...readFileSync(fileURLToPath(new URL('../src/tools.ts', import.meta.url)), 'utf8').matchAll(/slug:\s*'([a-z0-9-]+)'/g),
].map((m) => m[1]);

export const allRoutes: string[] = ['/', '/no-such-page', ...toolSlugs.map((s) => `/${s}`)];
