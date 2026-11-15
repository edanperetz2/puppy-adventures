import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { offlineFiles, onDemandPictures, styleLinks, scriptLinks } from './prepare-offline.mjs';

const source = new URL('../dist/', import.meta.url);
const site = new URL('../site/', import.meta.url);
const sourcePath = fileURLToPath(source);
const sitePath = fileURLToPath(site);
await mkdir(site, { recursive: true });
const html = await readFile(new URL('index.html', source), 'utf8');
const stylePaths = [...html.matchAll(styleLinks)].map(match => match[1].split('?')[0]);
const scripts = [...html.matchAll(scriptLinks)];
if (stylePaths.length === 0 || scripts.length !== 1) throw new Error('Expected game styles and one application entry');
const styles = stylePaths.map(path => `@import "${path}";`).join('\n');

const options = { absWorkingDir: sourcePath, outdir: sitePath, entryNames: 'game-[hash]',
  target: ['es2022', 'safari16'], bundle: true, minify: true, write: false, charset: 'utf8' };
const [scriptResult, styleResult] = await Promise.all([
  build({
    ...options, format: 'esm', entryPoints: [scripts[0][1].split('?')[0]],
    plugins: [{ name: 'local-modules', setup(build) {
      // Release filenames are content-hashed. A module with an old query
      // suffix is the same source file, and must run just once in the bundle.
      build.onResolve({ filter: /^\.\/.*\.js\?v=/ }, args => ({ path: resolve(args.resolveDir, args.path.split('?')[0]) }));
    } }],
  }),
  build({ ...options, stdin: { contents: styles, resolveDir: sourcePath, loader: 'css' }, external: ['./assets/*'] }),
]);
const [script] = scriptResult.outputFiles;
const [style] = styleResult.outputFiles;
const assets = [script, style].map(file => `./${basename(file.path)}`);
const [scriptUrl, styleUrl] = assets;
const page = html.replace(styleLinks, (_, path) => path === stylePaths[0] ? `<link rel="stylesheet" href="${styleUrl}">` : '').replace(scriptLinks, `<script type="module" src="${scriptUrl}"></script>`);
for (const file of await readdir(site)) {
  if (/^game-[A-Z0-9]+\.(js|css)$/.test(file) && !assets.includes(`./${file}`)) await unlink(new URL(file, site));
}
await cp(source, site, { recursive: true, filter: name => !/^offline(?:-(?:core|audio))?\.json$/.test(basename(name)) });
await Promise.all([
  writeFile(new URL('index.html', site), page),
  ...[script, style].map(file => writeFile(file.path, file.contents)),
]);
const core = await offlineFiles(site, assets);
// Changes to an image, the page, or a recording must also update installed copies.
const checksums = await Promise.all([...core, ...onDemandPictures, './offline-audio.json'].map(async path => {
  const file = await readFile(new URL(path, site));
  return createHash('sha256').update(path).update(file).digest('hex');
}));
const release = createHash('sha256').update(checksums.join('')).digest('hex').slice(0, 16);
const workerUrl = new URL('sw.js', site);
const worker = (await readFile(workerUrl, 'utf8')).replace(/(const CACHE = '[^']+)';/, `$1-${release}';`);
await writeFile(workerUrl, worker);
console.log(`Production app: ${scriptUrl} and ${styleUrl}`);
