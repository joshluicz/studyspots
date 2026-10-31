// Cloudflare Pages Function: GET and POST /api/suggestions/<key>
// <key> is a spot slug or an area slug from data/spots.json; anything else is 404.
// Storage: KV binding SUGGESTIONS. Key `s:<key>` holds a JSON array, newest first, capped.
// Abuse limits: 10 to 280 characters, an empty honeypot field, and 5 posts per IP per hour.
// Free tier throughout. Deleting a suggestion: edit the KV value in the Cloudflare dashboard.
import seed from '../../../data/spots.json';

const KEYS = new Set([...seed.areas.map((a) => a.slug), ...seed.spots.map((s) => s.slug)]);
const CAP = 200;
const PER_HOUR = 5;
const MIN = 10;
const MAX = 280;

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const clean = (t) => String(t ?? '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const pageFor = (key) => {
  const area = seed.areas.find((a) => a.slug === key);
  if (area) return `/${area.slug}/#suggestions`;
  const spot = seed.spots.find((s) => s.slug === key);
  return `/${spot.area}/${spot.slug}/#suggestions`;
};

export async function onRequestGet({ params, env }) {
  const key = params.key;
  if (!KEYS.has(key)) return json({ error: 'No such spot.' }, 404);
  if (!env.SUGGESTIONS) return json({ items: [], note: 'Storage is not bound on this deployment.' });
  const items = (await env.SUGGESTIONS.get(`s:${key}`, 'json')) || [];
  return json({ items });
}

export async function onRequestPost({ request, params, env }) {
  const key = params.key;
  const wantsJson = /application\/json/i.test(request.headers.get('accept') || '') || /application\/json/i.test(request.headers.get('content-type') || '');
  const fail = (status, error) => (wantsJson
    ? json({ error }, status)
    : new Response(`<!doctype html><meta charset="utf-8"><title>studyspots</title><p>${esc(error)}</p><p><a href="${KEYS.has(key) ? pageFor(key) : '/'}">Back</a></p>`, { status, headers: { 'content-type': 'text/html; charset=utf-8' } }));

  if (!KEYS.has(key)) return fail(404, 'No such spot.');
  if (!env.SUGGESTIONS) return fail(503, 'Suggestions are not switched on for this deployment yet.');

  let body = {};
  try {
    const ct = request.headers.get('content-type') || '';
    if (/application\/json/i.test(ct)) body = await request.json();
    else { const f = await request.formData(); body = Object.fromEntries(f.entries()); }
  } catch { return fail(400, 'That did not read as a suggestion.'); }

  if (clean(body.website)) return fail(400, 'That did not go through.'); // honeypot filled: a bot
  const text = clean(body.text);
  if (text.length < MIN) return fail(400, `Say a little more. ${MIN} characters is the minimum.`);
  if (text.length > MAX) return fail(400, `Keep it under ${MAX} characters.`);

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const rlKey = `rl:${ip}`;
  const count = Number((await env.SUGGESTIONS.get(rlKey)) || 0);
  if (count >= PER_HOUR) return fail(429, 'That is five in an hour from this connection. Try again later.');
  await env.SUGGESTIONS.put(rlKey, String(count + 1), { expirationTtl: 3600 });

  const item = { id: crypto.randomUUID(), text, at: new Date().toISOString() };
  const items = (await env.SUGGESTIONS.get(`s:${key}`, 'json')) || [];
  items.unshift(item);
  await env.SUGGESTIONS.put(`s:${key}`, JSON.stringify(items.slice(0, CAP)));

  if (wantsJson) return json({ item }, 201);
  return Response.redirect(new URL(pageFor(key), request.url).toString(), 303);
}
