#!/usr/bin/env node
// check-tokens.mjs — the token gate: every foreground/background pair clears WCAG, every token has a use.
//
// Why this exists: on 2026-09-01, building the Eitri Brokkr direction board, a contrast ratio was
// asserted at "4.6:1" that was really 2.34:1. It was plausible, specific and wrong, and nothing in
// the workflow could catch it. Design claims that are numbers must be computed, not reasoned about.
//
// It enforces the two halves of the stage-2 gate:
//   1. every declared foreground/background pair clears its threshold
//   2. NO TOKEN EXISTS WITHOUT A USE — an unusable accent is a hole in the palette, and the hole
//      shows up later as an inconsistency nobody can name
//
// Copied into studyspots 2026-10-30 unchanged. Numbers are computed here, never typed into a caption.
//
// Usage:  node scripts/check-tokens.mjs <manifest.json>
// Manifest shape:
//   { "tokensFile": "app/globals.css",
//     "prefix": "--color-",
//     "pairs": [ { "fg":"navy", "bg":"pearl", "use":"body text", "level":"body" } ],
//     "exempt": { "navy-deep": "ground only, never a foreground" } }

import fs from 'node:fs';
import path from 'node:path';

// WCAG 2.1: 1.4.3 body 4.5:1 · large text (>=24px, or >=18.66px bold) 3:1 · 1.4.11 UI + graphics 3:1
const THRESHOLD = { body: 4.5, large: 3, ui: 3, decorative: 0 };

const srgb = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

function luminance(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  const [r, g, b] = [0, 2, 4].map((i) => srgb(parseInt(full.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Pull `--color-name: #hex;` out of a CSS file. Non-hex values (rgb(), var()) are read but marked
// unresolvable rather than silently skipped — a token you cannot check is a token you cannot trust.
function readTokens(file, prefix) {
  const css = fs.readFileSync(file, 'utf8');
  const out = new Map();
  const re = new RegExp(`${prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}([\\w-]+)\\s*:\\s*([^;]+);`, 'g');
  for (const m of css.matchAll(re)) {
    const value = m[2].trim();
    out.set(m[1], { value, hex: /^#[0-9a-f]{3,8}$/i.test(value) ? value : null });
  }
  return out;
}

function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    console.error('usage: node scripts/check-tokens.mjs <manifest.json>');
    process.exit(2);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const root = path.dirname(path.resolve(manifestPath));
  const tokensFile = path.resolve(root, manifest.tokensFile);
  const prefix = manifest.prefix ?? '--color-';

  if (!fs.existsSync(tokensFile)) {
    console.error(`tokens file not found: ${tokensFile}`);
    process.exit(2);
  }

  const tokens = readTokens(tokensFile, prefix);
  const pairs = manifest.pairs ?? [];
  const exempt = manifest.exempt ?? {};

  console.log('=== TOKEN CONTRAST ===');
  console.log(`${tokens.size} token(s) in ${path.relative(process.cwd(), tokensFile)} · ${pairs.length} declared pair(s)\n`);

  const failures = [];
  const unresolved = [];
  const used = new Set();

  for (const p of pairs) {
    const level = p.level ?? 'body';
    const need = THRESHOLD[level];
    if (need === undefined) {
      failures.push(`unknown level "${level}" on ${p.fg} / ${p.bg}`);
      continue;
    }
    used.add(p.fg);
    used.add(p.bg);

    const fg = tokens.get(p.fg);
    const bg = tokens.get(p.bg);
    if (!fg || !bg) {
      failures.push(`undeclared token: ${!fg ? p.fg : p.bg} (pair ${p.fg} on ${p.bg})`);
      continue;
    }
    if (!fg.hex || !bg.hex) {
      unresolved.push(`${p.fg} on ${p.bg} — non-hex value, cannot verify (${!fg.hex ? fg.value : bg.value})`);
      continue;
    }

    const ratio = contrast(fg.hex, bg.hex);
    const ok = level === 'decorative' || ratio >= need;
    const line = `${ok ? 'ok  ' : 'FAIL'}  ${ratio.toFixed(2)}:1  ${(need ? `needs ${need}` : 'decorative').padEnd(10)}  ${p.fg} on ${p.bg}  — ${p.use ?? ''}`;
    console.log('  ' + line);
    if (!ok) {
      failures.push(`${p.fg} on ${p.bg} is ${ratio.toFixed(2)}:1, needs ${need} for ${level} — ${p.use ?? 'no stated use'}`);
    }
  }

  // "No token exists without a use." A token in neither a pair nor the exempt list is undeclared
  // intent: nobody has said what it is for, so nobody can say whether it is correct.
  const orphans = [...tokens.keys()].filter((t) => !used.has(t) && !(t in exempt));

  if (unresolved.length) {
    console.log('\n--- UNVERIFIABLE ---');
    for (const u of unresolved) console.log('  ? ' + u);
  }

  if (orphans.length) {
    console.log('\n--- TOKENS WITH NO STATED USE ---');
    for (const o of orphans) console.log(`  ! ${prefix}${o}: ${tokens.get(o).value}`);
    console.log('  Give each a pair in "pairs", or a reason in "exempt".');
  }

  console.log();
  if (failures.length || orphans.length) {
    console.log('STOP: ' + [
      failures.length ? `${failures.length} contrast failure(s)` : null,
      orphans.length ? `${orphans.length} token(s) with no stated use` : null,
    ].filter(Boolean).join(', '));
    for (const f of failures) console.log('  · ' + f);
    process.exit(1);
  }

  console.log(`clean — ${pairs.length} pair(s) verified, every token has a stated use`);
  process.exit(0);
}

main();
