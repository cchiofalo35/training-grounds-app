// Inline the built JS + CSS into dist/index.html so the whole SPA ships in a
// single file. GitHub Pages on this account only reliably serves the root
// index.html (newly-deployed /assets/* return 404), so we embed everything.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const assetsDir = join(dist, 'assets');
let html = readFileSync(join(dist, 'index.html'), 'utf8');

const assets = readdirSync(assetsDir);
const jsFile = assets.find((f) => f.endsWith('.js'));
const cssFile = assets.find((f) => f.endsWith('.css'));

// Drop modulepreload hints (they would 404 and aren't needed once inlined).
html = html.replace(/<link[^>]+rel="modulepreload"[^>]*>/g, '');

// Inline CSS: <link rel="stylesheet" ... href=".../assets/x.css"> -> <style>
// Use a function replacer so `$` sequences in the content aren't treated as
// special replacement patterns.
if (cssFile) {
  const css = readFileSync(join(assetsDir, cssFile), 'utf8').replace(/<\/style/gi, '<\\/style');
  html = html.replace(
    /<link[^>]+href="[^"]*\/assets\/[^"]+\.css"[^>]*>/g,
    () => `<style>${css}</style>`,
  );
}

// Inline JS: <script type="module" ... src=".../assets/x.js"></script> -> inline.
// Escape any literal `</script` in the bundle, otherwise it would prematurely
// close the inline <script> tag and the rest renders as text.
if (jsFile) {
  const js = readFileSync(join(assetsDir, jsFile), 'utf8').replace(/<\/script/gi, '<\\/script');
  html = html.replace(
    /<script[^>]+src="[^"]*\/assets\/[^"]+\.js"[^>]*><\/script>/g,
    () => `<script type="module">${js}</script>`,
  );
}

writeFileSync(join(dist, 'index.html'), html);
console.log(
  `inlined ${jsFile} (${(readFileSync(join(assetsDir, jsFile)).length / 1024) | 0}kb) + ${cssFile} -> index.html (${(html.length / 1024) | 0}kb)`,
);
