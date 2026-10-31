#!/usr/bin/env node
// build.mjs — renders dist/ from data/spots.json. No framework, no bundler.
// Every visible word on the site is in this file or in the seed; copy was written against
// marketingskills/copywriting and checked with copy-editing (docs/copy-check.md).
// Usage: node scripts/build.mjs   (SITE_URL=https://studyspots.org to change the canonical host)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');
const SITE_URL = (process.env.SITE_URL || 'https://studyspots.pages.dev').replace(/\/$/, '');
const REPO = 'https://github.com/joshluicz/studyspots';
const CREDIT_URL = 'https://eitribrokkr.com';
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/spots.json'), 'utf8'));

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const street = (addr) => (addr?.text || '').split(',')[0].trim();
const write = (rel, body) => { const f = path.join(DIST, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, body); };

// ---- shared chrome -----------------------------------------------------------------------------
const page = ({ title, description, pathname, body, bodyClass = '' }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE_URL}${pathname}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE_URL}${pathname}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#F6F1EA">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles/site.css">
</head>
<body class="${bodyClass}">
<header class="top"><div class="wrap"><a class="wordmark" href="/">studyspots</a><span class="where">Singapore</span></div></header>
<main class="wrap">
${body}
</main>
<footer class="foot"><div class="wrap">
  <span>Built by <a href="${CREDIT_URL}" rel="noopener">Eitri Brokkr</a></span>
  <span>Fix a fact: <a href="${REPO}/blob/main/data/spots.json" rel="noopener">the data file on GitHub</a></span>
</div></footer>
<script src="/js/site.js" defer></script>
</body>
</html>
`;

// ---- fact rendering ------------------------------------------------------------------------------
const factValue = (key, f) => {
  if (f.status !== 'reported') return null;
  const v = String(f.value);
  if (key === 'wifi') return v === 'yes' ? 'Yes' : v === 'no' ? 'No' : cap(v);
  if (key === 'food') return cap(v);
  return cap(v);
};
// Memphis: one fill per kind of place (tokens.css). Every word on a fill is ink.
const fillFor = (kind) => (/librar/i.test(kind) ? 'library' : /mall|shopping/i.test(kind) ? 'mall' : /caf/i.test(kind) ? 'cafe' : 'other');
const shapes = () => `<svg class="shapes" viewBox="0 0 112 40" aria-hidden="true" focusable="false"><circle class="s-teal" cx="18" cy="20" r="15"/><polygon class="s-yellow" points="44,35 60,6 76,35"/><path class="s-pink" d="M84 26 q6 -16 12 0 t12 0"/><path class="s-line" d="M84 26 q6 -16 12 0 t12 0"/></svg>`;
const reportsLabel = (f) => `<b class="num">${f.reports}</b> ${f.reports === 1 ? 'report' : 'reports'}`;

const hoursChip = (h) => {
  if (h.status === 'reported') return `<span class="fact st-plain">${esc(cap(h.text))}</span>`;
  if (h.status === 'partial') return `<span class="fact st-partial">${esc(cap(h.text))}</span>`;
  return `<span class="fact st-unknown">Hours not verified</span>`;
};
const socketsChip = (f) => (f.status === 'reported'
  ? `<span class="fact st-reported">Sockets reported</span>`
  : `<span class="fact st-unknown">Sockets: not reported yet</span>`);

const cardTags = (s) => {
  const t = [];
  if (s.facts.sockets.status === 'reported') t.push('sockets');
  if (/librar/i.test(s.kind)) t.push('library');
  if (/caf/i.test(s.kind)) t.push('cafe');
  if (/mall|shopping/i.test(s.kind)) t.push('mall');
  if (s.hours.status === 'reported' && /24 hours/i.test(s.hours.text)) t.push('late');
  return t.join(' ');
};

const card = (area, s) => `
<li data-tags="${esc(cardTags(s))}">
  <a class="card fill-${fillFor(s.kind)}" href="/${area.slug}/${s.slug}/">
    <span class="name">${esc(s.name)}</span>
    <span class="kind">${esc(s.kind)} · ${esc(street(s.address))}</span>
    <span class="facts">
      ${socketsChip(s.facts.sockets)}
      ${s.facts.noise.status === 'reported' ? `<span class="fact st-plain">${esc(cap(s.facts.noise.value))}</span>` : ''}
      ${s.facts.wifi.status === 'reported' ? (s.facts.wifi.value === 'no' ? `<span class="fact st-no">No Wi-Fi</span>` : `<span class="fact st-plain">Wi-Fi</span>`) : ''}
      ${hoursChip(s.hours)}
    </span>
  </a>
</li>`;

// ---- the suggestion block (spot pages and the area page share it) -------------------------------
const suggestBlock = ({ key, heading, empty, label, placeholder, button }) => `
<section class="block" data-suggestions="${esc(key)}" id="suggestions">
  <h2>${esc(heading)}</h2>
  <ol class="sugg-list" aria-live="polite"></ol>
  <p class="empty">${esc(empty)}</p>
  <form class="suggest" method="post" action="/api/suggestions/${esc(key)}">
    <label>${esc(label)}
      <textarea name="text" required minlength="10" maxlength="280" rows="4" placeholder="${esc(placeholder)}"></textarea>
    </label>
    <span class="counter" aria-hidden="true"></span>
    <label class="hp" aria-hidden="true">Leave this empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label>
    <button class="btn" type="submit">${esc(button)}</button>
    <p class="msg" role="status"></p>
    <p class="detail">No account needed. It appears on this page once sent.</p>
  </form>
</section>`;

// ---- pages ---------------------------------------------------------------------------------------
const area = seed.areas[0];
const spots = seed.spots.filter((s) => s.area === area.slug);
const n = spots.length;

const home = page({
  title: 'studyspots: where to sit and study near the MRT in Singapore',
  description: `Study spots near Singapore MRT stations with sockets, Wi-Fi, noise and opening hours as people report them. Starting with ${n} places around Bugis and City Hall.`,
  pathname: '/',
  body: `
<section class="hero">
  ${shapes()}
  <h1>Where to sit and study near the MRT</h1>
  <p class="lede">One area so far, ${esc(area.name)}: <b class="num">${n}</b> places with sockets, Wi-Fi, noise and hours as people report them.</p>
</section>
<div class="actions"><a class="btn" href="/${area.slug}/">Open ${esc(area.name)}</a></div>
<section class="how">
  <h2>How this works</h2>
  <ol>
    <li>Every opening hour and address links to the page it was read from, with the date.</li>
    <li>Sockets are reported by people who sat there. When nobody has, the page says so.</li>
    <li>Anyone can add what they learned on a spot's page. No account.</li>
  </ol>
</section>`,
});

const areaPage = page({
  title: `Study spots near Bugis and City Hall MRT: sockets, Wi-Fi, hours`,
  description: `${n} places to sit and study within a walk of Bugis and City Hall stations. Libraries, mall seating and cafés, with sockets, Wi-Fi, noise and hours as people report them.`,
  pathname: `/${area.slug}/`,
  body: `
<section class="hero">
  ${shapes()}
  <h1>${esc(area.name)}</h1>
  <p class="lede"><b class="num">${n}</b> places to sit and study within a walk of the two stations. Sockets, Wi-Fi and noise as people report them.</p>
</section>
<div class="filters" role="group" aria-label="Show only" hidden>
  <button class="chip" type="button" data-filter="all" aria-pressed="true">All</button>
  <button class="chip" type="button" data-filter="sockets" aria-pressed="false">Sockets reported</button>
  <button class="chip" type="button" data-filter="library" aria-pressed="false"><span class="sw fill-library" aria-hidden="true"></span>Libraries</button>
  <button class="chip" type="button" data-filter="mall" aria-pressed="false"><span class="sw fill-mall" aria-hidden="true"></span>Malls</button>
  <button class="chip" type="button" data-filter="cafe" aria-pressed="false"><span class="sw fill-cafe" aria-hidden="true"></span>Cafés</button>
  <button class="chip" type="button" data-filter="late" aria-pressed="false">Open 24 hours</button>
</div>
<ul class="list">
${spots.map((s) => card(area, s)).join('\n')}
</ul>
<p class="empty-filter" hidden>Nothing matches that filter yet.</p>
<div class="actions"></div>
${suggestBlock({
  key: area.slug,
  heading: 'Spots people suggested',
  empty: 'Nobody has suggested one yet.',
  label: 'Know a spot near here we missed?',
  placeholder: 'Name it, say where it is, and what you know about sockets and hours.',
  button: 'Suggest a spot',
})}`,
});

const row = (label, inner) => `<div class="row"><dt>${label}</dt><dd>${inner}</dd></div>`;
const factRow = (label, key, f) => {
  if (f.status === 'reported') {
    return row(label, `<span class="val">${esc(factValue(key, f))}</span><span class="status st-reported">${reportsLabel(f)}</span><span class="detail">by ${esc(f.by)}</span>`);
  }
  return row(label, `<span class="status st-unknown">Not reported yet</span>`);
};
const hoursRow = (h) => {
  if (h.status === 'reported') return row('Hours', `<span class="val">${esc(cap(h.text))}</span><span class="status st-source"><a href="${esc(h.source)}" rel="noopener">${esc(host(h.source))}</a></span>${h.detail ? `<span class="detail">${esc(h.detail)}</span>` : ''}`);
  if (h.status === 'partial') return row('Hours', `<span class="val">${esc(cap(h.text))}</span><span class="status st-partial">Partly known</span><span class="detail">${esc(h.detail)} Source: <a href="${esc(h.source)}" rel="noopener">${esc(host(h.source))}</a>.</span>`);
  return row('Hours', `<span class="status st-unknown">Not verified yet</span><span class="detail">${esc(h.note)} <a href="${esc(h.link)}" rel="noopener">${esc(host(h.link))}</a></span>`);
};

const spotPage = (s) => page({
  title: ((t) => (t.length + 13 <= 70 ? t + ' | studyspots' : t))(`${s.name}: sockets, Wi-Fi, hours`),
  description: `${s.name}, ${s.kind.toLowerCase()} near ${area.name}. What is known about sockets, Wi-Fi, noise and opening hours, with sources, and what people added.`,
  pathname: `/${area.slug}/${s.slug}/`,
  body: `
<p class="back"><a href="/${area.slug}/">Back to ${esc(area.name)}</a></p>
<section class="hero has-fill fill-${fillFor(s.kind)}">
  <h1>${esc(s.name)}</h1>
  <p class="kind">${esc(s.kind)}<span class="sep">·</span>${esc(s.address.text)}${s.address.verified ? '' : ' (address not yet verified)'}</p>
  ${s.stations?.length ? `<p class="kind">Near ${esc(s.stations.join(', '))} MRT, per the operator's page.</p>` : ''}
</section>
<dl class="factlist">
  ${factRow('Sockets', 'sockets', s.facts.sockets)}
  ${factRow('Wi-Fi', 'wifi', s.facts.wifi)}
  ${factRow('Noise', 'noise', s.facts.noise)}
  ${factRow('Food', 'food', s.facts.food)}
  ${hoursRow(s.hours)}
</dl>
${s.notes?.length ? `<section class="block"><h2>From the operator's page</h2><ul class="sources">${s.notes.map((nt) => `<li><q>${esc(nt.text)}</q> <a href="${esc(nt.source)}" rel="noopener">${esc(host(nt.source))}</a></li>`).join('')}</ul></section>` : ''}
${suggestBlock({
  key: s.slug,
  heading: 'What people added',
  empty: 'No suggestions yet. Add the first.',
  label: 'What should the next person know?',
  placeholder: 'Which level has sockets. When it fills up. What closes early.',
  button: 'Send suggestion',
})}
<section class="block">
  <h2>Where this comes from</h2>
  <ul class="sources">
    ${s.sources.map((src) => `<li><a href="${esc(src.url)}" rel="noopener">${esc(host(src.url))}</a>, <span class="checked">checked ${esc(src.checked)}</span>: <q>${esc(src.says)}</q></li>`).join('')}
    ${s.unverified ? `<li>${esc(s.unverified)}</li>` : ''}
  </ul>
</section>`,
});

const notFound = page({
  title: 'Not here | studyspots',
  description: 'That page is not here.',
  pathname: '/404',
  body: `<section class="hero notfound"><h1>That page is not here.</h1><p class="lede">Start from <a href="/${area.slug}/">${esc(area.name)}</a> or the <a href="/">front page</a>.</p></section>`,
});

// ---- write ---------------------------------------------------------------------------------------
fs.rmSync(DIST, { recursive: true, force: true });
write('index.html', home);
write(`${area.slug}/index.html`, areaPage);
for (const s of spots) write(`${area.slug}/${s.slug}/index.html`, spotPage(s));
write('404.html', notFound);

const urls = ['/', `/${area.slug}/`, ...spots.map((s) => `/${area.slug}/${s.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${SITE_URL}/sitemap.xml\n`);
write('_headers', `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/styles/*
  Cache-Control: public, max-age=3600
/js/*
  Cache-Control: public, max-age=3600
`);
write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#F6F1EA"/><rect x="4" y="4" width="24" height="24" fill="#15130F"/><rect x="8" y="8" width="16" height="16" fill="#1740B6"/></svg>\n`);
write('styles/site.css', fs.readFileSync(path.join(ROOT, 'src/styles/tokens.css'), 'utf8') + '\n' + fs.readFileSync(path.join(ROOT, 'src/styles/site.css'), 'utf8'));
write('js/site.js', fs.readFileSync(path.join(ROOT, 'src/js/site.js'), 'utf8'));
fs.mkdirSync(path.join(DIST, 'fonts'), { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, 'src/fonts'))) if (f.endsWith('.woff2')) fs.copyFileSync(path.join(ROOT, 'src/fonts', f), path.join(DIST, 'fonts', f));

console.log(`built dist/: ${urls.length} pages (${n} spots in ${area.name}), canonical host ${SITE_URL}`);
