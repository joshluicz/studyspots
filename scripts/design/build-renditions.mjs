#!/usr/bin/env node
// build-renditions.mjs — stage-1 direction board for studyspots v0.
// Four renditions of the same two screens (area page, spot page), same copy, same seed names,
// 390x780, Public Sans. Every contrast number in a caption is COMPUTED here, never typed.
// Usage: node scripts/design/build-renditions.mjs  → docs/design/renditions-2026-10-31.html
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('docs/design/renditions-2026-10-31.html');

// ---- locked tokens (shared by every style) -------------------------------------------------
const T = {
  paper: '#F6F1EA',   // ground
  ink: '#15130F',     // all type, all numbers
  blue: '#1740B6',    // actions only
  white: '#FFFFFF',
  muted: '#5E584F',   // secondary text
  ok: '#19733F',      // status: reported / confirmed
  warn: '#9A5200',    // status: partly known
  unknown: '#5E584F', // status: not yet reported (same as muted, by design)
  bad: '#A6221A',     // status: closed / wrong
};
// style-only values (introduced by a rendition, must be justified in its caption)
const S = {
  neuShade: '#EDE6DC',   // neumorphism: pressed-chip ground
  neuDark: '#D8CFC2',    // neumorphism: shadow colour (decorative)
  glassBlue: '#D5DDF4',  // glassmorphism: background blob (decorative)
  glassAmber: '#F3E2CB', // glassmorphism: background blob (decorative)
  memYellow: '#F7C948',  // memphis: fill
  memPink: '#F28DB2',    // memphis: fill
  memTeal: '#5BC8C2',    // memphis: fill
};

// ---- contrast maths (WCAG 2.1) -----------------------------------------------------------
const srgb = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = (hex) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => srgb(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
// composite a translucent white layer over a background: what the eye actually sees through glass
const over = (bg, alpha, top = '#FFFFFF') => {
  const c = (h, i) => parseInt(h.slice(1 + i, 3 + i), 16);
  const mix = (i) => Math.round(alpha * c(top, i) + (1 - alpha) * c(bg, i));
  return '#' + [0, 2, 4].map((i) => mix(i).toString(16).padStart(2, '0')).join('').toUpperCase();
};
const NEED = { body: 4.5, large: 3, ui: 3 };
const pairRow = (p) => {
  const r = contrast(p.fg, p.bg);
  const ok = r >= NEED[p.level];
  return { ...p, ratio: r.toFixed(2), ok };
};

// ---- the copy, written once --------------------------------------------------------------
const AREA = 'Bugis / City Hall';
const SPOTS = [
  { name: 'National Library Building', kind: 'Public library', where: '100 Victoria Street', sockets: 'reported', socketsText: 'Sockets reported: plenty', noise: 'Quiet', open: 'Open till 21:00' },
  { name: 'library@esplanade', kind: 'Public library', where: 'Esplanade Mall, level 3', sockets: 'unknown', socketsText: 'Sockets: not reported yet', noise: 'Quiet', open: 'Open till 21:00' },
  { name: 'Bras Basah Complex', kind: 'Mall seating', where: '231 Bain Street', sockets: 'unknown', socketsText: 'Sockets: not reported yet', noise: 'Medium', open: 'Hours vary by shop' },
  { name: 'Funan', kind: 'Mall seating', where: '107 North Bridge Road', sockets: 'unknown', socketsText: 'Sockets: not reported yet', noise: 'Medium', open: 'Open till 22:00' },
  { name: 'Bugis Junction', kind: 'Mall seating', where: '200 Victoria Street', sockets: 'unknown', socketsText: 'Sockets: not reported yet', noise: 'Noisy', open: 'Open till 22:00' },
  { name: 'Raffles City', kind: 'Mall seating', where: '252 North Bridge Road', sockets: 'unknown', socketsText: 'Sockets: not reported yet', noise: 'Medium', open: 'Open till 22:00' },
  { name: 'National Design Centre', kind: 'Atrium', where: '111 Middle Road', sockets: 'unknown', socketsText: 'Sockets: not reported yet', noise: 'Quiet', open: 'Open till 21:00' },
];

const areaScreen = () => `
<div class="screen area">
  <header class="top">
    <span class="wordmark">studyspots</span>
    <span class="country">Singapore</span>
  </header>
  <section class="hero">
    <h1>${AREA}</h1>
    <p class="lede"><b class="num">${SPOTS.length}</b> places to sit and study near the two stations. Sockets, Wi-Fi and noise as students report them.</p>
  </section>
  <div class="filters" role="group" aria-label="Filters">
    <span class="chip on">All</span><span class="chip">Has sockets</span><span class="chip">Quiet</span><span class="chip">Open now</span>
  </div>
  <ul class="list">
    ${SPOTS.map((s) => `
    <li class="card">
      <div class="card-head"><span class="name">${s.name}</span><span class="kind">${s.kind} · ${s.where}</span></div>
      <div class="facts">
        <span class="fact st-${s.sockets}">${s.socketsText}</span>
        <span class="fact st-plain">${s.noise}</span>
        <span class="fact st-plain">${s.open}</span>
      </div>
    </li>`).join('')}
  </ul>
  <div class="bar"><button class="primary" type="button">Suggest a spot</button></div>
  <footer class="foot"><span>Built by Eitri Brokkr</span></footer>
</div>`;

const spotScreen = () => {
  const s = SPOTS[0];
  return `
<div class="screen spot">
  <header class="top">
    <span class="back">Back to ${AREA}</span>
  </header>
  <section class="hero">
    <h1>${s.name}</h1>
    <p class="kind">${s.kind} · ${s.where}</p>
  </section>
  <dl class="factlist">
    <div class="row"><dt>Sockets</dt><dd><span class="val">Plenty</span><span class="status st-reported"><b class="num">1</b> report</span></dd></div>
    <div class="row"><dt>Wi-Fi</dt><dd><span class="val">Yes</span><span class="status st-reported"><b class="num">1</b> report</span></dd></div>
    <div class="row"><dt>Noise</dt><dd><span class="val">Quiet</span><span class="status st-reported"><b class="num">1</b> report</span></dd></div>
    <div class="row"><dt>Hours</dt><dd><span class="val">10:00 to 21:00 daily</span><span class="status st-source">nlb.gov.sg</span></dd></div>
    <div class="row"><dt>Food</dt><dd><span class="val">Unknown</span><span class="status st-unknown">Not reported yet</span></dd></div>
  </dl>
  <section class="suggest">
    <h2>Know something about this spot?</h2>
    <p class="empty">No suggestions yet. Add the first.</p>
    <label class="field"><span class="label">What should the next person know?</span>
      <span class="input">e.g. which level has sockets, when it gets noisy</span></label>
    <button class="primary" type="button">Send suggestion</button>
    <p class="note">No account needed. It appears here once sent.</p>
  </section>
  <footer class="foot"><span>Built by Eitri Brokkr</span></footer>
</div>`;
};

// ---- the four renditions -----------------------------------------------------------------
const styles = [
  {
    id: 'neo', name: 'Neobrutalist',
    thesis: 'Every fact sits in a hard box. Borders and offset shadows do the grouping, so the eye never has to guess what belongs to what.',
    bets: 'students trust a page that looks hand-built and unpolished over one that looks like an app store listing.',
    costs: 'about 14px of border and shadow per card edge; seven cards burn a third of the screen on chrome.',
    principle: 'Build hierarchy with, in order of strength: size → weight → colour/contrast → space → position',
    risk: 'The block shadow is a costume. It is loud for a tool whose whole value is quiet accuracy, and the crowd will have seen it on every Gumroad clone this year.',
    pairs: [
      { fg: T.ink, bg: T.white, use: 'card text on white card', level: 'body' },
      { fg: T.muted, bg: T.white, use: 'kind line on white card', level: 'body' },
      { fg: T.ok, bg: T.white, use: 'reported status on white card', level: 'body' },
      { fg: T.white, bg: T.blue, use: 'button label', level: 'body' },
      { fg: T.ink, bg: T.paper, use: 'card border against paper', level: 'ui' },
    ],
    css: `
      .neo .screen{background:${T.paper}}
      .neo .top{border-bottom:3px solid ${T.ink}}
      .neo h1{font-weight:800;letter-spacing:-.02em}
      .neo .chip{border:2px solid ${T.ink};border-radius:0;background:${T.paper};font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.06em;padding:6px 10px}
      .neo .chip.on{background:${T.ink};color:${T.paper}}
      .neo .card{background:${T.white};border:3px solid ${T.ink};box-shadow:5px 5px 0 ${T.ink};border-radius:0}
      .neo .name{font-weight:800}
      .neo .fact{border:2px solid ${T.ink};border-radius:0;padding:3px 7px;font-weight:600;font-size:12px}
      .neo .primary{background:${T.blue};color:${T.white};border:3px solid ${T.ink};box-shadow:5px 5px 0 ${T.ink};border-radius:0;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
      .neo .factlist .row{border:3px solid ${T.ink};border-radius:0;background:${T.white};margin-bottom:-3px}
      .neo .factlist{box-shadow:5px 5px 0 ${T.ink};margin-bottom:28px}
      .neo .status{border:2px solid ${T.ink};border-radius:0;padding:1px 6px;font-size:11px;font-weight:700}
      .neo .input{border:3px solid ${T.ink};border-radius:0;background:${T.white};box-shadow:4px 4px 0 ${T.ink}}
      .neo .foot{border-top:3px solid ${T.ink}}
    `,
  },
  {
    id: 'neu', name: 'Neomorphism',
    thesis: 'One material, pressed and raised. Cards are the paper itself lifted by light, so nothing on the page is a different colour from anything else except the one blue action.',
    bets: 'a calm, single-material surface is what a student wants to look at for the eighth hour of the day.',
    costs: 'hierarchy lives entirely in shadows, so it costs two shadows per element and reads flat in a screenshot.',
    principle: 'Gestalt shortcuts: group related items with proximity; separate sections with space, not lines',
    risk: 'A card edge made of shadow has no measurable contrast. WCAG 1.4.11 wants 3:1 for component boundaries and this style cannot deliver it, so on a dim phone or in sunlight the list collapses into one beige field.',
    pairs: [
      { fg: T.ink, bg: T.paper, use: 'card text on raised paper', level: 'body' },
      { fg: T.muted, bg: T.paper, use: 'kind line on raised paper', level: 'body' },
      { fg: T.muted, bg: S.neuShade, use: 'pressed chip text on shaded paper', level: 'body' },
      { fg: T.ok, bg: S.neuShade, use: 'reported status on shaded paper', level: 'body' },
      { fg: T.warn, bg: S.neuShade, use: 'partly known status on shaded paper', level: 'body' },
      { fg: T.white, bg: T.blue, use: 'button label', level: 'body' },
      { fg: S.neuDark, bg: T.paper, use: 'card edge (shadow) against paper', level: 'ui' },
    ],
    css: `
      .neu .screen{background:${T.paper}}
      .neu h1{font-weight:600;letter-spacing:-.01em}
      .neu .chip{border:0;border-radius:999px;background:${T.paper};box-shadow:inset 3px 3px 6px ${S.neuDark},inset -3px -3px 6px ${T.white};color:${T.muted};font-weight:600;font-size:12px;padding:7px 12px}
      .neu .chip.on{box-shadow:4px 4px 10px ${S.neuDark},-4px -4px 10px ${T.white};color:${T.ink}}
      .neu .card{background:${T.paper};border:0;border-radius:18px;box-shadow:8px 8px 18px ${S.neuDark},-8px -8px 18px ${T.white}}
      .neu .name{font-weight:700}
      .neu .fact{border:0;border-radius:999px;background:${S.neuShade};box-shadow:inset 2px 2px 4px ${S.neuDark},inset -2px -2px 4px ${T.white};padding:4px 9px;font-weight:600;font-size:12px}
      .neu .primary{background:${T.blue};color:${T.white};border:0;border-radius:999px;box-shadow:6px 6px 14px ${S.neuDark},-4px -4px 10px ${T.white};font-weight:700}
      .neu .factlist{background:${T.paper};border-radius:18px;box-shadow:8px 8px 18px ${S.neuDark},-8px -8px 18px ${T.white};padding:6px 16px;margin-bottom:28px}
      .neu .factlist .row{border:0;padding:12px 0;border-bottom:1px solid ${S.neuShade}}
      .neu .factlist .row:last-child{border-bottom:0}
      .neu .status{border:0;border-radius:999px;background:${S.neuShade};box-shadow:inset 2px 2px 4px ${S.neuDark},inset -2px -2px 4px ${T.white};padding:2px 8px;font-size:11px;font-weight:600}
      .neu .input{border:0;border-radius:14px;background:${T.paper};box-shadow:inset 4px 4px 8px ${S.neuDark},inset -4px -4px 8px ${T.white}}
      .neu .top,.neu .foot{border:0}
    `,
  },
  {
    id: 'glass', name: 'Glassmorphism',
    thesis: 'The facts float on frosted panes over a soft, coloured ground. Depth comes from blur and translucency rather than lines or shadows.',
    bets: 'a student picks the page that feels like their phone\'s own UI, and most of them are on iOS.',
    costs: 'backdrop-filter on seven cards is the most expensive paint in this set; a mid-range Android will drop frames on scroll.',
    principle: 'Avoid pure #000 and pure #FFF for large fields',
    risk: 'Text contrast depends on what happens to be behind the glass at that scroll position. The numbers below are the worst case over the two blobs; a photo or a darker blob later would break them without anyone changing a token. It is also the look taste-skill lists first among LLM defaults.',
    pairs: [
      { fg: T.ink, bg: over(S.glassBlue, 0.62), use: 'card text through 62% white glass over the blue blob (worst case)', level: 'body' },
      { fg: T.muted, bg: over(S.glassBlue, 0.62), use: 'kind line through glass over the blue blob', level: 'body' },
      { fg: T.ok, bg: over(S.glassAmber, 0.62), use: 'reported status through glass over the amber blob', level: 'body' },
      { fg: T.warn, bg: over(S.glassBlue, 0.62), use: 'partly known status through glass over the blue blob', level: 'body' },
      { fg: T.ink, bg: S.glassBlue, use: 'heading directly on the blue blob', level: 'body' },
      { fg: T.white, bg: T.blue, use: 'button label', level: 'body' },
      { fg: T.white, bg: S.glassBlue, use: 'card\'s 1px white edge against the blue blob', level: 'ui' },
    ],
    css: `
      .glass .screen{background:${T.paper} radial-gradient(circle at 15% 12%, ${S.glassBlue} 0, transparent 38%),radial-gradient(circle at 90% 55%, ${S.glassAmber} 0, transparent 40%),radial-gradient(circle at 30% 95%, ${S.glassBlue} 0, transparent 35%)}
      .glass .screen{background-color:${T.paper}}
      .glass h1{font-weight:700;letter-spacing:-.015em}
      .glass .chip{border:1px solid rgba(255,255,255,.9);border-radius:999px;background:rgba(255,255,255,.45);backdrop-filter:blur(10px);font-weight:600;font-size:12px;padding:7px 12px}
      .glass .chip.on{background:rgba(255,255,255,.85)}
      .glass .card{background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.95);border-radius:16px;backdrop-filter:blur(14px);box-shadow:0 8px 24px rgba(21,19,15,.06), inset 0 1px 0 rgba(255,255,255,.9)}
      .glass .name{font-weight:700}
      .glass .fact{border:1px solid rgba(21,19,15,.12);border-radius:999px;background:rgba(255,255,255,.5);padding:4px 9px;font-weight:600;font-size:12px}
      .glass .primary{background:${T.blue};color:${T.white};border:1px solid rgba(255,255,255,.6);border-radius:14px;box-shadow:0 8px 24px rgba(23,64,182,.25);font-weight:700}
      .glass .factlist{background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.95);border-radius:16px;backdrop-filter:blur(14px);padding:6px 16px;margin-bottom:28px}
      .glass .factlist .row{border:0;padding:12px 0;border-bottom:1px solid rgba(21,19,15,.08)}
      .glass .factlist .row:last-child{border-bottom:0}
      .glass .status{border:1px solid rgba(21,19,15,.12);border-radius:999px;background:rgba(255,255,255,.55);padding:2px 8px;font-size:11px;font-weight:600}
      .glass .input{border:1px solid rgba(255,255,255,.95);border-radius:14px;background:rgba(255,255,255,.62);backdrop-filter:blur(14px)}
      .glass .top,.glass .foot{border:0}
    `,
  },
  {
    id: 'mem', name: 'Memphis',
    thesis: 'Flat colour blocks, squiggles and confetti dots. Each kind of place gets a fill, so a student can tell a library from a mall before reading a word.',
    bets: 'students share things that look like a sticker sheet; a screenshot of this page would travel on Telegram.',
    costs: 'three extra fills plus two patterns, every one of which competes with the status colours for meaning.',
    principle: 'Structure: one dominant (here: near-black/charcoal), one accent (warm gold/amber), a small neutral ramp. That\'s it.',
    risk: 'Pattern noise competes with the facts, and the status colours (green reported, amber partly known) lose their meaning next to three decorative fills. Muted grey and blue both fail on the pink fill, so every word on a fill has to be ink; the style forces one colour of type.',
    pairs: [
      { fg: T.ink, bg: S.memYellow, use: 'library card text on yellow', level: 'body' },
      { fg: T.ink, bg: S.memPink, use: 'mall card text on pink', level: 'body' },
      { fg: T.ink, bg: S.memTeal, use: 'atrium card text on teal', level: 'body' },
      { fg: T.muted, bg: S.memPink, use: 'muted grey on pink (measured, failed, so kind lines on fills are set in ink)', level: 'body' },
      { fg: T.blue, bg: S.memPink, use: 'blue text on pink (measured, failed, so blue is confined to the button)', level: 'body' },
      { fg: T.white, bg: T.blue, use: 'button label', level: 'body' },
      { fg: T.blue, bg: T.paper, use: 'button against paper', level: 'ui' },
    ],
    css: `
      .mem .screen{background:${T.paper};background-image:radial-gradient(${T.ink} 1.2px, transparent 1.3px);background-size:14px 14px;background-position:0 0}
      .mem .top{border-bottom:3px solid ${T.ink};background:${T.paper}}
      .mem .hero{background:${T.paper};position:relative}
      .mem .hero::after{content:"";position:absolute;right:16px;top:10px;width:34px;height:34px;border:3px solid ${T.ink};border-radius:50%;background:${S.memTeal}}
      .mem h1{font-weight:800;letter-spacing:-.02em}
      .mem .filters{background:${T.paper}}
      .mem .chip{border:2px solid ${T.ink};border-radius:999px;background:${T.white};font-weight:700;font-size:12px;padding:6px 11px}
      .mem .chip.on{background:${S.memYellow}}
      .mem .card{border:3px solid ${T.ink};border-radius:4px;box-shadow:4px 4px 0 ${T.ink};background:${S.memPink}}
      .mem .card:nth-child(1),.mem .card:nth-child(2){background:${S.memYellow}}
      .mem .card:nth-child(7){background:${S.memTeal}}
      .mem .name{font-weight:800}
      .mem .card .kind{color:${T.ink}}
      .mem .fact{border:2px solid ${T.ink};border-radius:999px;background:${T.white};padding:3px 8px;font-weight:600;font-size:12px}
      .mem .primary{background:${T.blue};color:${T.white};border:3px solid ${T.ink};border-radius:999px;box-shadow:4px 4px 0 ${T.ink};font-weight:800}
      .mem .factlist{border:3px solid ${T.ink};border-radius:4px;box-shadow:4px 4px 0 ${T.ink};background:${S.memYellow};padding:6px 16px;margin-bottom:28px}
      .mem .factlist .row{border:0;padding:12px 0;border-bottom:2px dashed ${T.ink}}
      .mem .factlist .row:last-child{border-bottom:0}
      .mem .status{border:2px solid ${T.ink};border-radius:999px;background:${T.white};padding:1px 7px;font-size:11px;font-weight:700}
      .mem .suggest{background:${T.paper};border:3px solid ${T.ink};padding:14px;border-radius:4px}
      .mem .input{border:3px solid ${T.ink};border-radius:4px;background:${T.white}}
      .mem .foot{border-top:3px solid ${T.ink};background:${T.paper}}
      .mem .spot .hero,.mem .area .hero{margin:0 -20px;padding:50px 20px 6px}
      .mem .area .list{background:transparent}
    `,
  },
];

// shared, locked pairs (computed once, shown once)
const sharedPairs = [
  { fg: T.ink, bg: T.paper, use: 'ink on paper (all type, all numbers)', level: 'body' },
  { fg: T.muted, bg: T.paper, use: 'muted on paper (kind lines, notes)', level: 'body' },
  { fg: T.blue, bg: T.paper, use: 'blue on paper (links, actions)', level: 'body' },
  { fg: T.ok, bg: T.paper, use: 'reported status on paper', level: 'body' },
  { fg: T.warn, bg: T.paper, use: 'partly known status on paper', level: 'body' },
  { fg: T.unknown, bg: T.paper, use: 'not reported status on paper', level: 'body' },
  { fg: T.bad, bg: T.paper, use: 'closed / wrong status on paper', level: 'body' },
  { fg: T.white, bg: T.blue, use: 'white on blue (button label)', level: 'body' },
].map(pairRow);

const base = `
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#E8E2D9;color:${T.ink};font-family:'Public Sans',system-ui,sans-serif;color-scheme:light}
  .board{padding:28px 28px 40px;width:1700px}
  .title{display:flex;gap:18px;align-items:baseline;margin-bottom:18px;flex-wrap:wrap}
  .title h1{font-size:22px;font-weight:700}
  .title .meta{font-size:13px;color:${T.muted}}
  .cols{display:grid;grid-template-columns:repeat(4,390px);gap:28px;align-items:start}
  .col{display:grid;gap:14px}
  .col h2{font-size:15px;font-weight:700;letter-spacing:.02em;text-transform:uppercase}
  .phone{width:390px;height:780px;overflow:hidden;position:relative;border:1px solid #CFC7BB;background:${T.paper}}
  .screen{position:absolute;inset:0;display:flex;flex-direction:column;padding:0 20px;overflow:hidden;color:${T.ink};font-size:15px;line-height:1.45}
  .top{display:flex;justify-content:space-between;align-items:center;height:48px;font-size:13px;flex:none}
  .wordmark{font-weight:700;letter-spacing:-.01em}
  .country,.back{color:${T.muted}}
  .hero{padding:16px 0 10px;flex:none}
  h1{font-size:28px;line-height:1.1;margin-bottom:8px}
  .lede{font-size:14px;color:${T.ink}}
  .num{color:${T.ink};font-weight:800}
  .kind{font-size:13px;color:${T.muted}}
  .filters{display:flex;gap:8px;flex-wrap:wrap;padding:4px 0 12px;flex:none}
  .chip{display:inline-block;color:${T.ink};line-height:1}
  .list{list-style:none;display:grid;gap:12px;flex:1;min-height:0;overflow:hidden}
  .card{padding:12px 12px 10px}
  .card-head{display:grid;gap:2px;margin-bottom:8px}
  .name{font-size:16px;line-height:1.2}
  .facts{display:flex;gap:6px;flex-wrap:wrap}
  .fact{display:inline-block;line-height:1.2}
  .st-reported{color:${T.ok}}
  .st-unknown{color:${T.unknown}}
  .st-plain{color:${T.ink}}
  .st-source{color:${T.muted}}
  .bar{flex:none;padding:12px 0 8px}
  .primary{display:block;width:100%;padding:14px 16px;font:inherit;font-size:16px;cursor:pointer}
  .foot{flex:none;display:flex;justify-content:center;padding:10px 0 12px;font-size:12px;color:${T.muted}}
  /* spot */
  .factlist{display:grid}
  .factlist .row{display:grid;grid-template-columns:72px 1fr;gap:10px;align-items:baseline;padding:10px 12px}
  .factlist dt{font-size:13px;color:${T.muted};font-weight:600}
  .factlist dd{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
  .val{font-weight:600}
  .status{display:inline-block;white-space:nowrap}
  .suggest{flex:1;min-height:0}
  .suggest h2{font-size:18px;line-height:1.2;margin-bottom:6px}
  .empty{font-size:13px;color:${T.muted};margin-bottom:12px}
  .field{display:grid;gap:6px;margin-bottom:12px}
  .label{font-size:13px;font-weight:600}
  .input{display:block;min-height:76px;padding:10px 12px;font-size:14px;color:${T.muted};line-height:1.4}
  .note{font-size:12px;color:${T.muted};margin-top:8px}
  /* captions */
  .cap{background:${T.white};border:1px solid #D9D2C7;padding:14px 16px;font-size:12.5px;line-height:1.5;display:grid;gap:8px}
  .cap p b{font-weight:700}
  .cap .risk{border-left:4px solid ${T.bad};padding-left:10px}
  .cap table{border-collapse:collapse;width:100%;font-size:11.5px;font-variant-numeric:tabular-nums}
  .cap td{padding:3px 4px;border-top:1px solid #EEE8DE;vertical-align:top}
  .cap td.r{text-align:right;white-space:nowrap;font-weight:700}
  .cap .sw{display:inline-block;width:10px;height:10px;border:1px solid #BBB;vertical-align:-1px;margin-right:4px}
  .ok{color:${T.ok}} .fail{color:${T.bad}}
  .shared{margin-top:22px;max-width:1644px;background:${T.white};border:1px solid #D9D2C7;padding:14px 16px;font-size:12.5px;display:grid;gap:8px}
`;

const swatch = (hex) => `<span class="sw" style="background:${hex}"></span>`;
const pairsTable = (rows) => `<table>${rows.map((p) => `<tr><td>${swatch(p.fg)}${p.fg} on ${swatch(p.bg)}${p.bg}</td><td>${p.use}</td><td class="r ${p.ok ? 'ok' : 'fail'}">${p.ratio}:1 ${p.ok ? 'pass' : 'FAIL'} (${p.level} ≥ ${NEED[p.level]})</td></tr>`).join('')}</table>`;

const column = (st) => {
  const rows = st.pairs.map(pairRow);
  return `
  <div class="col ${st.id}">
    <h2>${st.name}</h2>
    <div class="phone">${areaScreen()}</div>
    <div class="phone">${spotScreen()}</div>
    <div class="cap">
      <p><b>Thesis.</b> ${st.thesis}</p>
      <p><b>Bets on</b> ${st.bets}</p>
      <p><b>Costs</b> ${st.costs}</p>
      <p><b>Principle.</b> “${st.principle}”</p>
      <p class="risk"><b>Honest risk.</b> ${st.risk}</p>
      <p><b>Text pairs this style introduces</b> (computed, WCAG 2.1):</p>
      ${pairsTable(rows)}
    </div>
  </div>`;
};

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>studyspots v0 renditions</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>${base}${styles.map((s) => s.css).join('\n')}</style></head>
<body><div class="board">
  <div class="title"><h1>studyspots v0 · four renditions of two screens</h1><span class="meta">area page (${AREA}) and spot page · 390×780 · Public Sans · same copy and seed names in every column · locked: paper ${T.paper}, ink ${T.ink}, blue ${T.blue} for actions only, status ${T.ok} / ${T.warn} / ${T.unknown} / ${T.bad} · generated ${new Date().toISOString().slice(0, 10)}</span></div>
  <div class="cols">${styles.map(column).join('')}</div>
  <div class="shared"><p><b>Locked pairs shared by all four</b> (computed once):</p>${pairsTable(sharedPairs)}
  <p>Facts on the screens: seed names are real places; the hours shown are being verified against each operator's page before they enter the data file; socket counts are never shown as numbers, only as a reported/not-reported status.</p></div>
</div></body></html>`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);

// print the computed numbers so the session sees them too
console.log('wrote', path.relative(process.cwd(), OUT));
console.log('\nSHARED');
for (const p of sharedPairs) console.log(`  ${p.ok ? 'ok  ' : 'FAIL'} ${p.ratio}:1  ${p.fg} on ${p.bg}  ${p.use}`);
for (const st of styles) {
  console.log('\n' + st.name.toUpperCase());
  for (const p of st.pairs.map(pairRow)) console.log(`  ${p.ok ? 'ok  ' : 'FAIL'} ${p.ratio}:1  ${p.fg} on ${p.bg}  ${p.use}`);
}
