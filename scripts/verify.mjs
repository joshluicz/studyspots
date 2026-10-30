#!/usr/bin/env node
// verify.mjs — walks the built site at phone width with Playwright and fails on what a phone would show.
// Usage: node scripts/verify.mjs                       (serves dist/ itself; skips the API round trip)
//        BASE_URL=http://localhost:8788 node scripts/verify.mjs --api   (against `wrangler pages dev`)
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'docs/verify');
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/spots.json'), 'utf8'));
const area = seed.areas[0];
const spots = seed.spots.filter((s) => s.area === area.slug);
const withApi = process.argv.includes('--api');

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
const serve = () => new Promise((resolve) => {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    let f = path.join(DIST, p);
    if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { f = path.join(DIST, '404.html'); res.statusCode = 404; }
    res.setHeader('content-type', MIME[path.extname(f)] || 'application/octet-stream');
    fs.createReadStream(f).pipe(res);
  });
  srv.listen(0, '127.0.0.1', () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}` }));
});

const failures = [];
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failures.push(msg); };

const local = process.env.BASE_URL ? null : await serve();
const BASE = process.env.BASE_URL || local.url;
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const pageErrors = [];
const pg = await ctx.newPage();
pg.on('pageerror', (e) => pageErrors.push(e.message));
pg.on('console', (m) => {
  if (m.type() !== 'error') return;
  const url = m.location()?.url || '';
  if (!withApi && /\/api\/suggestions\//.test(url)) return; // static server has no functions: expected
  if (/\/nope\/$/.test(url)) return; // the deliberate 404 walk
  pageErrors.push(m.text() + ' @ ' + url);
});

const walk = async (name, url) => {
  const res = await pg.goto(BASE + url, { waitUntil: 'networkidle' });
  check(res && res.ok(), `${name}: ${url} answers ${res && res.status()}`);
  await pg.evaluate(() => document.fonts.ready);
  const m = await pg.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth,
    footer: !!Array.from(document.querySelectorAll('footer a')).find((a) => /Eitri Brokkr/.test(a.textContent) && /eitribrokkr\.com/.test(a.href)),
    font: document.fonts.check('16px "Public Sans"'),
    h1: document.querySelector('h1')?.textContent.trim(),
    cards: document.querySelectorAll('.list .card').length,
    title: document.title,
  }));
  check(m.scrollW <= m.innerW, `${name}: no horizontal scroll (${m.scrollW} <= ${m.innerW})`);
  check(m.footer, `${name}: footer credit "Built by Eitri Brokkr" links to eitribrokkr.com`);
  check(m.font, `${name}: Public Sans loaded`);
  check(m.title.length > 10 && m.title.length <= 70, `${name}: title length ${m.title.length}`);
  await pg.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  return m;
};

const home = await walk('home', '/');
check(/Where to sit and study/.test(home.h1), `home: h1 "${home.h1}"`);
const areaM = await walk('area', `/${area.slug}/`);
check(areaM.cards === spots.length, `area: ${areaM.cards} cards for ${spots.length} seed spots (Bugis / City Hall filled from the seed)`);
const filtersVisible = await pg.evaluate(() => !document.querySelector('.filters').hidden);
check(filtersVisible, 'area: filters appear with JS');
await pg.click('.chip[data-filter="library"]');
const libs = await pg.evaluate(() => Array.from(document.querySelectorAll('.list > li')).filter((li) => !li.hidden).length);
check(libs === spots.filter((s) => /librar/i.test(s.kind)).length, `area: library filter shows ${libs}`);
await pg.click('.chip[data-filter="all"]');
const first = spots[0];
const spotM = await walk('spot', `/${area.slug}/${first.slug}/`);
check(spotM.h1 === first.name, `spot: h1 is the seed name "${spotM.h1}"`);
const rows = await pg.evaluate(() => Array.from(document.querySelectorAll('.factlist dt')).map((d) => d.textContent.trim()));
check(JSON.stringify(rows) === JSON.stringify(['Sockets', 'Wi-Fi', 'Noise', 'Food', 'Hours']), `spot: fact rows ${rows.join(', ')}`);
const socketNumbers = await pg.evaluate(() => /\b\d+\s*(sockets?|plugs?|outlets?|power points?)\b/i.test(document.body.innerText));
check(!socketNumbers, 'spot: no socket count printed anywhere on the page');
const nf = await pg.goto(BASE + '/nope/', { waitUntil: 'networkidle' });
check(nf.status() === 404, `404 page answers ${nf.status()}`);

if (withApi) {
  const text = `Verify run ${new Date().toISOString().slice(0, 16)}: the window seats on the upper level had sockets.`;
  await pg.goto(BASE + `/${area.slug}/${first.slug}/`, { waitUntil: 'networkidle' });
  await pg.fill('form.suggest textarea', text);
  await pg.click('form.suggest button[type="submit"]');
  await pg.waitForSelector('.sugg.is-new', { timeout: 10000 });
  const shown = await pg.evaluate(() => document.querySelector('.sugg.is-new p')?.textContent);
  check(shown === text, 'api: the suggestion appears on the spot immediately after sending');
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForSelector('.sugg', { timeout: 10000 });
  const persisted = await pg.evaluate((t) => Array.from(document.querySelectorAll('.sugg p')).some((p) => p.textContent === t), text);
  check(persisted, 'api: the suggestion is still there after a reload (stored, not just drawn)');
  await pg.screenshot({ path: path.join(OUT, 'spot-with-suggestion.png'), fullPage: true });
  const r404 = await fetch(BASE + '/api/suggestions/not-a-spot', { headers: { accept: 'application/json' } });
  check(r404.status === 404, `api: unknown key answers ${r404.status}`);
  const short = await fetch(BASE + `/api/suggestions/${first.slug}`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ text: 'short', website: '' }) });
  check(short.status === 400, `api: too-short text answers ${short.status}`);
  const bot = await fetch(BASE + `/api/suggestions/${first.slug}`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ text: 'a bot filled the honeypot field', website: 'http://spam' }) });
  check(bot.status === 400, `api: filled honeypot answers ${bot.status}`);
}

check(pageErrors.length === 0, `no console errors (${pageErrors.join(' | ').slice(0, 300)})`);
await browser.close();
if (local) local.srv.close();
console.log(failures.length ? `\nSTOP: ${failures.length} failure(s)` : `\nclean — screenshots in ${path.relative(ROOT, OUT)}/`);
process.exit(failures.length ? 1 : 0);
