#!/usr/bin/env node
// validate-seed.mjs — the seed's honesty gate. Fails the build when a fact has no source, when a
// socket count sneaks in as a number, or when a spot points at an area that does not exist.
// Usage: node scripts/validate-seed.mjs [data/spots.json]
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve(process.argv[2] ?? 'data/spots.json');
const seed = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [];
const warn = [];
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const isUrl = (s) => /^https?:\/\//.test(s);
const FACTS = ['sockets', 'wifi', 'noise', 'food'];
const STATUS = new Set(['reported', 'unknown']);
const HOURS = new Set(['reported', 'partial', 'unknown']);

const areas = new Map((seed.areas ?? []).map((a) => [a.slug, a]));
if (!areas.size) errors.push('no areas');
for (const a of areas.values()) for (const k of ['slug', 'name', 'stations', 'intro']) if (!a[k]) errors.push(`area ${a.slug}: missing ${k}`);

const slugs = new Set();
for (const s of seed.spots ?? []) {
  const id = s.slug ?? '(no slug)';
  if (slugs.has(id)) errors.push(`duplicate slug ${id}`);
  slugs.add(id);
  for (const k of ['slug', 'area', 'name', 'kind', 'address', 'hours', 'facts', 'sources']) if (s[k] === undefined) errors.push(`${id}: missing ${k}`);
  if (!areas.has(s.area)) errors.push(`${id}: area ${s.area} not in areas`);
  if (!/^[a-z0-9-]+$/.test(id)) errors.push(`${id}: slug must be lowercase letters, digits and hyphens`);
  if (s.address) {
    if (typeof s.address.text !== 'string') errors.push(`${id}: address.text`);
    if (s.address.verified && !isUrl(s.address.source ?? '')) errors.push(`${id}: verified address needs a source URL`);
  }
  if (s.hours) {
    if (!HOURS.has(s.hours.status)) errors.push(`${id}: hours.status ${s.hours.status}`);
    if (s.hours.status !== 'unknown' && !isUrl(s.hours.source ?? '')) errors.push(`${id}: hours need a source URL`);
    if (s.hours.status === 'unknown' && !s.hours.note) errors.push(`${id}: unknown hours need a note`);
  }
  for (const f of FACTS) {
    const v = s.facts?.[f];
    if (!v) { errors.push(`${id}: facts.${f} missing`); continue; }
    if (!STATUS.has(v.status)) errors.push(`${id}: facts.${f}.status ${v.status}`);
    if (v.status === 'reported') {
      if (v.value === undefined || v.value === null) errors.push(`${id}: reported ${f} needs a value`);
      if (!Number.isInteger(v.reports) || v.reports < 1) errors.push(`${id}: reported ${f} needs reports >= 1`);
      if (!v.by) errors.push(`${id}: reported ${f} needs "by"`);
      if (!isUrl(v.source ?? '')) errors.push(`${id}: reported ${f} needs a source URL`);
    }
    if (f === 'sockets') {
      if (typeof v.value === 'number' || /\b\d+\s*(sockets?|points?|plugs?|outlets?)\b/i.test(String(v.value ?? ''))) {
        errors.push(`${id}: a socket COUNT is in the seed ("${v.value}"). Counts come from people on the live site, never from this file.`);
      }
      for (const k of Object.keys(v)) if (/count|number|qty|quantity/i.test(k)) errors.push(`${id}: socket field "${k}" looks like a count`);
    }
  }
  for (const n of s.notes ?? []) if (!n.text || !isUrl(n.source ?? '')) errors.push(`${id}: every note needs text and a source URL`);
  for (const src of s.sources ?? []) {
    if (!isUrl(src.url ?? '')) errors.push(`${id}: source url`);
    if (!isDate(src.checked ?? '')) errors.push(`${id}: source ${src.url} needs checked YYYY-MM-DD`);
    if (!src.says) errors.push(`${id}: source ${src.url} needs "says"`);
  }
  if (!(s.sources ?? []).length && !s.unverified) errors.push(`${id}: no sources and no "unverified" reason`);
  if (s.unverified) warn.push(`${id}: unverified — ${s.unverified}`);
}

const byArea = {};
for (const s of seed.spots ?? []) byArea[s.area] = (byArea[s.area] ?? 0) + 1;
console.log('=== SEED ===');
console.log(`${areas.size} area(s), ${slugs.size} spot(s): ${Object.entries(byArea).map(([a, n]) => `${a}=${n}`).join(', ')}`);
for (const w of warn) console.log('  ! ' + w);
if (errors.length) {
  console.log(`\nSTOP: ${errors.length} problem(s)`);
  for (const e of errors) console.log('  · ' + e);
  process.exit(1);
}
console.log('clean — every fact has a source, no socket counts');
