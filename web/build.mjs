// Builds the React landing page: client bundle into /assets/home, then prerenders its HTML for crawlers.
import { build } from 'vite';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const configFile = root + 'vite.config.ts';
await build({ configFile, logLevel: 'warn' });
const ssrOut = root + '.ssr';
await build({ configFile, logLevel: 'warn', build: { ssr: root + 'src/entry-server.tsx', outDir: ssrOut, emptyOutDir: true, manifest: false, rollupOptions: { input: root + 'src/entry-server.tsx' } } });
const { render } = await import(pathToFileURL(ssrOut + '/entry-server.js').href);
const manifest = JSON.parse(readFileSync(root + '../assets/home/.vite/manifest.json', 'utf8'));
const entry = manifest['src/main.tsx'];
const home = { html: render(), script: '/assets/home/' + entry.file, styles: (entry.css || []).map(file => '/assets/home/' + file) };
writeFileSync(root + '../scripts/home.generated.json', JSON.stringify(home));
rmSync(ssrOut, { recursive: true, force: true });
rmSync(root + '../assets/home/.vite', { recursive: true, force: true });
console.log('Built and prerendered the landing page.');
