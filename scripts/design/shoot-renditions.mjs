#!/usr/bin/env node
// Screenshot the renditions board at 2x with Playwright. Usage: node scripts/design/shoot-renditions.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // preinstalled via NODE_PATH, CJS only
import path from 'node:path';
const html = path.resolve('docs/design/renditions-2026-10-31.html');
const out = path.resolve('docs/design/renditions-2026-10-31.png');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1700, height: 1200 }, deviceScaleFactor: 2 });
await p.goto('file://' + html, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
const fontOk = await p.evaluate(() => document.fonts.check('16px "Public Sans"'));
const size = await p.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
await p.screenshot({ path: out, fullPage: true });
// one PNG per column so each can be read at full size
for (const id of ['neo', 'neu', 'glass', 'mem']) {
  const el = await p.$(`.col.${id}`);
  await el.screenshot({ path: path.resolve(`docs/design/renditions-2026-10-31-${id}.png`) });
}
console.log(JSON.stringify({ out: path.relative(process.cwd(), out), fontOk, size }));
await b.close();
